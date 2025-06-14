
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, reportId, roomId, componentName } = await req.json();
    if (!imageUrl || !reportId || !roomId) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400, headers: corsHeaders });
    }

    // Supabase client config
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch canonical details
    function cleanNameForFolder(name: string): string {
      return name.replace(/[^a-zA-Z0-9\s-_]/g, "").replace(/\s+/g, "_").toLowerCase();
    }

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, type, property_id, properties(name)")
      .eq("id", roomId)
      .maybeSingle();

    if (roomError || !roomData) {
      return new Response(JSON.stringify({ error: "Could not resolve room details" }), { status: 500, headers: corsHeaders });
    }

    const roomName = roomData.name && roomData.name.trim() !== "" ? roomData.name : (roomData.type || "room");
    const propertyName =
      (roomData.properties && roomData.properties.name && roomData.properties.name.trim() !== "")
        ? roomData.properties.name
        : "unknown_property";

    // Get user account name (fetch via properties)
    let userId: string | null = null;
    if (roomData.properties && roomData.properties.id) {
      // Fetch property for user id
      const { data: property, error: propErr } = await supabase
        .from("properties")
        .select("user_id")
        .eq("id", roomData.properties.id)
        .maybeSingle();
      userId = property?.user_id || null;
    }

    // Fallback if not found
    if (!userId) {
      return new Response(JSON.stringify({ error: "Could not resolve user account" }), { status: 500, headers: corsHeaders });
    }

    // Fetch user email or first_name/last_name from profiles
    let userAccountName = "unknown_user";
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

    if (profile && (profile.first_name || profile.last_name)) {
      userAccountName = `${(profile.first_name || "")} ${(profile.last_name || "")}`.trim();
      userAccountName = cleanNameForFolder(userAccountName);
    } else {
      // Fallback: use a portion of the user id
      userAccountName = cleanNameForFolder(userId.toString().substring(0, 8));
    }

    // Clean names for folders
    const folderUser = userAccountName;
    const folderProperty = cleanNameForFolder(propertyName);
    const folderRoom = cleanNameForFolder(roomName);
    const folderComponent = componentName ? cleanNameForFolder(componentName) : "general";

    // Extract unique filename from imageUrl
    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];

    // Compose new path
    const targetPath = `${folderUser}/${folderProperty}/${folderRoom}/${folderComponent}/${filename}`;
    const BUCKET = "inspection-images";

    // Parse the existing storage path
    const bucketPattern = `/storage/v1/object/public/${BUCKET}/`;
    const originalPath = imageUrl.split(bucketPattern)[1];

    if (!originalPath) {
      return new Response(JSON.stringify({ error: "Unexpected Supabase URL pattern" }), { status: 400, headers: corsHeaders });
    }

    // If already in canonical path, no move needed!
    if (originalPath === targetPath) {
      return new Response(JSON.stringify({ url: imageUrl, organized: false }), { status: 200, headers: corsHeaders });
    }

    // Move/copy
    const { data: copyData, error: copyError } = await supabase.storage
      .from(BUCKET)
      .copy(originalPath, targetPath);

    if (copyError) {
      return new Response(JSON.stringify({ error: "Error copying file", details: copyError }), { status: 500, headers: corsHeaders });
    }

    // Delete the original file
    await supabase.storage.from(BUCKET).remove([originalPath]);

    // Build the new public URL
    const baseUrl = imageUrl.split(bucketPattern)[0];
    const newUrl = `${baseUrl}${bucketPattern}${targetPath}`;

    // Return the new URL
    return new Response(JSON.stringify({ url: newUrl, organized: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unknown error", details: err?.message }), { status: 500, headers: corsHeaders });
  }
});
