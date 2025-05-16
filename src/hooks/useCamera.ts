
import { useState, useEffect, useCallback } from "react";
import { useCameraPermissions } from "./camera/useCameraPermissions";
import { useCameraStream } from "./camera/useCameraStream";
import { useCameraCapture } from "./camera/useCameraCapture";

/**
 * Options for the useCamera hook
 */
interface UseCameraOptions {
  initialFacingMode?: 'user' | 'environment';
  timeoutMs?: number;
}

/**
 * Hook to manage camera functionality including stream initialization,
 * photo capture, and camera switching
 * 
 * @param {UseCameraOptions} options - Configuration options
 * @param {string} [options.initialFacingMode='environment'] - Initial camera facing mode
 * @param {number} [options.timeoutMs=3000] - Timeout for camera initialization
 * @returns Camera control methods and state
 */
export const useCamera = (options: UseCameraOptions = {}) => {
  const {
    initialFacingMode = 'environment',
    timeoutMs = 3000,
  } = options;

  // Camera facing mode state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  
  // Use our smaller, focused hooks
  const { permissionState, checkPermissions } = useCameraPermissions();
  const { 
    videoRef, 
    isReady, 
    isProcessing, 
    errorMessage, 
    startStream, 
    stopStream 
  } = useCameraStream({ facingMode, timeoutMs });
  const { isCapturing, takePhoto } = useCameraCapture(videoRef, isReady);

  /**
   * Switches between front and back cameras
   */
  const flipCamera = useCallback(() => {
    setFacingMode(current => current === 'environment' ? 'user' : 'environment');
    // Camera will restart in useEffect when facingMode changes
  }, []);

  /**
   * Start the camera with the current facing mode
   */
  const startCamera = useCallback(async () => {
    const permissionGranted = await checkPermissions();
    await startStream(permissionGranted);
  }, [checkPermissions, startStream]);

  // Start/stop the camera when the component mounts/unmounts or facingMode changes
  useEffect(() => {
    startCamera();
    
    return () => {
      stopStream();
    };
  }, [facingMode, startCamera, stopStream]);

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
    stopCamera: stopStream,
    flipCamera,
    takePhoto,
  };
};
