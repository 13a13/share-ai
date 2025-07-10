
import { useState, useCallback } from "react";

export const useCameraPermissions = () => {
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'>('prompt');

  // Check if we already have camera permission
  const checkCameraPermission = useCallback(async () => {
    try {
      // First check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("🚨 Camera API not available - falling back to older API or failing gracefully");
        
        // Try legacy getUserMedia with proper typing
        const legacyGetUserMedia = (navigator as any).getUserMedia || 
          (navigator as any).webkitGetUserMedia || 
          (navigator as any).mozGetUserMedia;
          
        if (legacyGetUserMedia) {
          console.log("📱 Using legacy getUserMedia API");
          setPermissionState('prompt');
          return true;
        } else {
          console.error("❌ No camera API available");
          setPermissionState('denied');
          return false;
        }
      }

      // Try to query permission state if supported
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log("🔍 Camera permission state:", result.state);
          setPermissionState(result.state as 'prompt'|'granted'|'denied');
          return result.state === 'granted';
        } catch (permError) {
          console.warn("⚠️ Permission query failed, proceeding with direct access:", permError);
          // Fall through to direct access attempt
        }
      }

      // If permissions API is not available, try direct access
      console.log("🎥 Attempting direct camera access to check permissions");
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });
        
        // If we got here, permission is granted
        testStream.getTracks().forEach(track => track.stop());
        console.log("✅ Camera permission granted");
        setPermissionState('granted');
        return true;
      } catch (accessError: any) {
        console.warn("⚠️ Camera access test failed:", accessError);
        
        if (accessError.name === 'NotAllowedError' || accessError.name === 'PermissionDeniedError') {
          setPermissionState('denied');
          return false;
        } else {
          // Other errors (like no camera) - assume we can try
          setPermissionState('prompt');
          return true;
        }
      }
    } catch (error) {
      console.error("❌ Error checking camera permission:", error);
      // On error, assume we need to prompt
      setPermissionState('prompt');
      return true;
    }
  }, []);

  return {
    permissionState,
    setPermissionState,
    checkCameraPermission,
  };
};
