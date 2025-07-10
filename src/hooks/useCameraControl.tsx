
import { useState, useEffect, useCallback, useRef } from "react";
import { useCameraPermissions } from "./camera/useCameraPermissions";
import { useCameraStream } from "./camera/useCameraStream";
import { useCameraCapture } from "./camera/useCameraCapture";
import { useCameraZoom } from "./camera/useCameraZoom";
import { useCameraDevices } from "./camera/useCameraDevices";

interface UseCameraControlProps {
  maxPhotos: number;
}

export function useCameraControl({ maxPhotos }: UseCameraControlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  // Use smaller, focused hooks
  const { permissionState, setPermissionState, checkCameraPermission } = useCameraPermissions();
  const { hasMultipleCameras, checkMultipleCameras } = useCameraDevices();
  const { 
    videoRef, 
    streamRef,
    isReady: isCameraActive,
    isProcessing, 
    errorMessage, 
    startStream, 
    stopStream,
    setIsProcessing,
    setErrorMessage
  } = useCameraStream({ facingMode, timeoutMs: 3000 });
  
  const { isCapturing, takePhoto } = useCameraCapture(videoRef, isCameraActive);
  const { ZOOM_LEVELS, currentZoomIndex, handleZoomChange, applyZoom } = useCameraZoom(streamRef, videoRef);

  // Start the camera with current settings
  const startCamera = useCallback(async () => {
    try {
      setErrorMessage(null);
      
      // Check permissions first
      const permissionGranted = await checkCameraPermission();
      
      if (!permissionGranted) {
        setPermissionState('denied');
        return;
      }

      // Start the stream
      await startStream(permissionGranted);
      
      // Apply initial zoom level after stream is ready
      setTimeout(() => {
        applyZoom(ZOOM_LEVELS[currentZoomIndex]);
      }, 100);
      
      setPermissionState('granted');
      
    } catch (error: any) {
      console.error("Error starting camera:", error);
      
      let friendlyMessage = "Could not access camera. Please ensure you've granted camera permissions.";
      
      // Handle specific error cases
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        friendlyMessage = "Camera access denied. Please enable camera permission in your browser settings.";
        setPermissionState('denied');
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        friendlyMessage = "No camera detected. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        friendlyMessage = "Camera is in use by another application. Please close other apps using the camera.";
      }
      
      setErrorMessage(friendlyMessage);
    }
  }, [checkCameraPermission, startStream, setPermissionState, setErrorMessage, applyZoom, ZOOM_LEVELS, currentZoomIndex]);

  // Stop the camera
  const stopCamera = useCallback(() => {
    stopStream();
  }, [stopStream]);

  // Flip between front and rear cameras
  const switchCamera = useCallback(() => {
    setErrorMessage(null);
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    // Restart camera with new facing mode
    setTimeout(startCamera, 300);
  }, [setErrorMessage, stopCamera, startCamera]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isCameraActive,
    errorMessage,
    isProcessing,
    hasMultipleCameras,
    facingMode,
    permissionState,
    currentZoomIndex,
    ZOOM_LEVELS,
    checkMultipleCameras,
    checkCameraPermission,
    startCamera,
    stopCamera,
    switchCamera,
    handleZoomChange,
    setIsProcessing,
    takePhoto,
    isCapturing
  };
}
