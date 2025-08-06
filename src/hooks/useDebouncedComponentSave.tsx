import { useCallback, useRef, useEffect } from "react";
import { RoomComponent } from "@/types";

interface UseDebouncedComponentSaveProps {
  onSave: (roomId: string, components: RoomComponent[]) => Promise<void>;
  delay?: number;
}

interface UseDebouncedComponentSaveReturn {
  debouncedSave: (roomId: string, components: RoomComponent[]) => void;
  saveImmediately: (roomId: string, components: RoomComponent[]) => void;
}

/**
 * Hook to provide debounced saving for component updates
 * This prevents excessive database calls while ensuring data is eventually saved
 */
export const useDebouncedComponentSave = ({
  onSave,
  delay = 2000 // 2 seconds default delay
}: UseDebouncedComponentSaveProps): UseDebouncedComponentSaveReturn => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestDataRef = useRef<{ roomId: string; components: RoomComponent[] } | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedSave = useCallback((roomId: string, components: RoomComponent[]) => {
    console.log(`⏰ useDebouncedComponentSave: Scheduling save for room ${roomId} with ${components.length} components`);
    
    // Store the latest data
    latestDataRef.current = { roomId, components };

    // Clear existing timeout
    if (timeoutRef.current) {
      console.log(`⏰ useDebouncedComponentSave: Clearing existing timeout`);
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      if (latestDataRef.current) {
        console.log(`💾 useDebouncedComponentSave: Executing auto-save for room ${latestDataRef.current.roomId}`);
        try {
          await onSave(latestDataRef.current.roomId, latestDataRef.current.components);
          console.log("✅ useDebouncedComponentSave: Auto-saved component changes successfully");
        } catch (error) {
          console.error("❌ useDebouncedComponentSave: Auto-save failed:", error);
        }
        latestDataRef.current = null;
      }
    }, delay);
  }, [onSave, delay]);

  const saveImmediately = useCallback(async (roomId: string, components: RoomComponent[]) => {
    console.log(`⚡ useDebouncedComponentSave: Executing immediate save for room ${roomId} with ${components.length} components`);
    
    // Clear any pending debounced save
    if (timeoutRef.current) {
      console.log(`⚡ useDebouncedComponentSave: Clearing pending debounced save`);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clear any stale data
    latestDataRef.current = null;

    // Save immediately
    try {
      await onSave(roomId, components);
      console.log("✅ useDebouncedComponentSave: Immediately saved component changes successfully");
    } catch (error) {
      console.error("❌ useDebouncedComponentSave: Immediate save failed:", error);
      throw error;
    }
  }, [onSave]);

  return {
    debouncedSave,
    saveImmediately
  };
};