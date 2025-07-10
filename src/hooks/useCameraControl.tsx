
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
  const [isInitializing, setIsInitializing] = useState(false);
  const initializingRef = useRef(false);
  
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
  } = useCameraStream({ facingMode, timeoutMs: 5000 }); // Increased timeout
  
  const { isCapturing, takePhoto } = useCameraCapture(videoRef, isCameraActive);
  const { ZOOM_LEVELS, currentZoomIndex, handleZoomChange, applyZoom } = useCameraZoom(streamRef, videoRef);

  // Start the camera with current settings
  const startCamera = useCallback(async () => {
    // Prevent multiple simultaneous initialization attempts
    if (initializingRef.current) {
      console.log("🚫 Camera already initializing, skipping duplicate request");
      return;
    }

    try {
      initializingRef.current = true;
      setIsInitializing(true);
      setErrorMessage(null);
      
      console.log("🎥 Starting camera initialization");
      
      // Check permissions first
      const permissionGranted = await checkCameraPermission();
      
      if (!permissionGranted) {
        setPermissionState('denied');
        return;
      }

      // Start the stream
      await startStream(permissionGranted);
      
      // Apply initial zoom level after stream is ready with a longer delay
      setTimeout(() => {
        if (isCameraActive) {
          applyZoom(ZOOM_LEVELS[currentZoomIndex]);
        }
      }, 200);
      
      setPermissionState('granted');
      console.log("✅ Camera initialization completed successfully");
      
    } catch (error: any) {
      console.error("❌ Error starting camera:", error);
      
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
    } finally {
      initializingRef.current = false;
      setIsInitializing(false);
    }
  }, [checkCameraPermission, startStream, setPermissionState, setErrorMessage, applyZoom, ZOOM_LEVELS, currentZoomIndex, isCameraActive]);

  // Stop the camera
  const stopCamera = useCallback(() => {
    console.log("🛑 Stopping camera from useCameraControl");
    initializingRef.current = false;
    setIsInitializing(false);
    stopStream();
  }, [stopStream]);

  // Flip between front and rear cameras
  const switchCamera = useCallback(async () => {
    if (initializingRef.current) {
      console.log("🚫 Cannot switch camera while initializing");
      return;
    }

    setErrorMessage(null);
    console.log(`🔄 Switching camera from ${facingMode} to ${facingMode === 'environment' ? 'user' : 'environment'}`);
    
    // Stop current camera
    stopCamera();
    
    // Wait a bit before switching
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Change facing mode
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    
    // Start camera with new facing mode after a short delay
    setTimeout(() => {
      startCamera();
    }, 500);
  }, [setErrorMessage, stopCamera, startCamera, facingMode]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up useCameraControl");
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isCameraActive,
    errorMessage,
    isProcessing: isProcessing || isInitializing,
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
