
import { useState, useCallback } from "react";

export const useCameraPermissions = () => {
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'>('prompt');

  // Check if we already have camera permission
  const checkCameraPermission = useCallback(async () => {
    try {
      // Try to query permission state if supported
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(result.state as 'prompt'|'granted'|'denied');
        return result.state === 'granted';
      }
      return true;
    } catch (error) {
      console.error("Error checking camera permission:", error);
      // Permissions API not available, we'll just try starting the camera directly
      return true;
    }
  }, []);

  return {
    permissionState,
    setPermissionState,
    checkCameraPermission,
  };
};
