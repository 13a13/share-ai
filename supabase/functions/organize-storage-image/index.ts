import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQ = 30; // max 30 requests/min per client

function getClientKey(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return `${ip}:${ua}`;
}

function checkRateLimit(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQ - 1 };
  }
  if (entry.count >= MAX_REQ) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.reset - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, remaining: MAX_REQ - entry.count };
}

function cleanNameForFolder(name: string): string {
  return (name || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase()
    .slice(0, 64);
}

function extractPathAfterBucket(imageUrl: string, bucket: string): string | null {
  try {
    // Find the first occurrence of `${bucket}/` and take everything after
    const marker = `${bucket}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return null;
    return imageUrl.substring(idx + marker.length);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const rl = checkRateLimit(req);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: corsHeaders });
  }

  try {
    const { imageUrl, reportId, roomId, componentName } = await req.json();

    if (!imageUrl || !roomId) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400, headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user session
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = userData.user.id;

    // Validate and fetch room (RLS ensures only owner can view)
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, type, property_id")
      .eq("id", roomId)
      .maybeSingle();

    if (roomError || !room) {
      return new Response(JSON.stringify({ error: "Room not found or access denied" }), { status: 403, headers: corsHeaders });
    }

    // Fetch property name
    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("name")
      .eq("id", room.property_id)
      .maybeSingle();

    if (propErr || !property) {
      return new Response(JSON.stringify({ error: "Property not found or access denied" }), { status: 403, headers: corsHeaders });
    }

    const BUCKET = "inspection-images";

    // Extract original path relative to the bucket
    const originalPath = extractPathAfterBucket(imageUrl, BUCKET);
    if (!originalPath) {
      return new Response(JSON.stringify({ error: "Unexpected Supabase URL pattern" }), { status: 400, headers: corsHeaders });
    }

    const roomName = (room.name && room.name.trim() !== "") ? room.name : (room.type || "room");
    const folderUser = userId; // critical: first segment is the authenticated user's UUID
    const folderProperty = cleanNameForFolder(property.name || "unknown_property");
    const folderRoom = cleanNameForFolder(roomName);
    const folderComponent = cleanNameForFolder(componentName || "general");

    // Extract filename
    const filename = originalPath.split("/").pop() || "file";

    // Compose new canonical path
    const targetPath = `${folderUser}/${folderProperty}/${folderRoom}/${folderComponent}/${filename}`;

    if (originalPath === targetPath) {
      return new Response(JSON.stringify({ url: imageUrl, organized: false }), { status: 200, headers: corsHeaders });
    }

    // Move the object within the bucket (atomic server-side)
    const { error: moveError } = await supabase.storage
      .from(BUCKET)
      .move(originalPath, targetPath);

    if (moveError) {
      return new Response(JSON.stringify({ error: "Error moving file", details: moveError.message }), { status: 500, headers: corsHeaders });
    }

    // Build a (potentially public) URL like the input one
    const baseUrl = SUPABASE_URL.replace(/\/$/, "");
    const newUrl = `${baseUrl}/storage/v1/object/public/${BUCKET}/${targetPath}`;

    return new Response(JSON.stringify({ url: newUrl, organized: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Unknown error", details: err?.message || "" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
