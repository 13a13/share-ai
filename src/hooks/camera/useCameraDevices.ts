
import { useState, useCallback } from "react";

export const useCameraDevices = () => {
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check if device has multiple cameras
  const checkMultipleCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error) {
      console.error("Error checking for multiple cameras:", error);
    }
  }, []);

  return {
    hasMultipleCameras,
    checkMultipleCameras,
  };
};
