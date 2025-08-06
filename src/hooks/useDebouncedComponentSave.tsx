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
    // Store the latest data
    latestDataRef.current = { roomId, components };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      if (latestDataRef.current) {
        try {
          await onSave(latestDataRef.current.roomId, latestDataRef.current.components);
          console.log("✅ Auto-saved component changes");
        } catch (error) {
          console.error("❌ Auto-save failed:", error);
        }
        latestDataRef.current = null;
      }
    }, delay);
  }, [onSave, delay]);

  const saveImmediately = useCallback(async (roomId: string, components: RoomComponent[]) => {
    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clear any stale data
    latestDataRef.current = null;

    // Save immediately
    try {
      await onSave(roomId, components);
      console.log("✅ Immediately saved component changes");
    } catch (error) {
      console.error("❌ Immediate save failed:", error);
      throw error;
    }
  }, [onSave]);

  return {
    debouncedSave,
    saveImmediately
  };
};