
import { useState, useCallback, useEffect } from "react";

/**
 * Hook to manage camera permissions
 * @returns The current permission state and methods to check permissions
 */
export const useCameraPermissions = () => {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  /**
   * Check camera permissions using the Permissions API
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (navigator.permissions) {
        const permResult = await navigator.permissions.query({ name: 'camera' as any });
        setPermissionState(permResult.state as any);
        
        if (permResult.state === 'denied') {
          return false;
        }
      }
      return true;
    } catch (permError) {
      // Ignore permission query errors, we'll try getUserMedia anyway
      console.warn("Permission query failed:", permError);
      return true;
    }
  }, []);

  return {
    permissionState,
    setPermissionState,
    checkPermissions,
  };
};
