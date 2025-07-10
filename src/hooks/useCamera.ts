
import { useState, useEffect, useCallback } from "react";
import { useCameraControl } from "./useCameraControl";

interface UseCameraOptions {
  initialFacingMode?: 'user' | 'environment';
  timeoutMs?: number;
}

export const useCamera = (options: UseCameraOptions = {}) => {
  const {
    initialFacingMode = 'environment',
    timeoutMs = 3000
  } = options;

  // Use the refactored useCameraControl hook
  const {
    videoRef,
    isCameraActive: isReady,
    isProcessing,
    errorMessage,
    permissionState,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera: flipCamera,
    takePhoto,
    isCapturing,
  } = useCameraControl({ maxPhotos: 20 });

  console.log("📱 useCamera hook initialized with:", {
    initialFacingMode,
    timeoutMs,
    permissionState,
    isReady,
    isProcessing,
    errorMessage
  });

  return {
    // Refs
    videoRef,
    
    // State
    isReady,
    isProcessing,
    isCapturing,
    errorMessage,
    permissionState,
    facingMode,
    
    // Camera controls
    startCamera,
    stopCamera,
    flipCamera,
    takePhoto,
  };
};
