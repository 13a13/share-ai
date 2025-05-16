
import { useState, useEffect, useRef } from "react";

interface UseCameraControlProps {
  maxPhotos: number;
}

export function useCameraControl({ maxPhotos }: UseCameraControlProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'>('prompt');
  
  const ZOOM_LEVELS = [0.5, 1, 2, 3];
  const [currentZoomIndex, setCurrentZoomIndex] = useState(1); // Default to 1x zoom (index 1)

  // Check if device has multiple cameras
  const checkMultipleCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error) {
      console.error("Error checking for multiple cameras:", error);
    }
  };

  // Check if we already have camera permission
  const checkCameraPermission = async () => {
    try {
      // Try to query permission state if supported
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(result.state as 'prompt'|'granted'|'denied');
        
        if (result.state === 'granted') {
          // If we already have permission, start camera right away
          startCamera();
        }
      } else {
        // If permissions API not available, try to start camera directly
        // This will trigger the permission prompt if needed
        startCamera();
      }
    } catch (error) {
      console.error("Error checking camera permission:", error);
      // If permissions API fails, try to start camera directly
      startCamera();
    }
  };

  // Start the camera with current settings
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      setIsProcessing(true);
      setPermissionState('prompt');
      
      // Get user media with appropriate constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setStream(mediaStream);
          setCameraActive(true);
          setIsProcessing(false);
          setPermissionState('granted');
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setErrorMessage(
        "Could not access camera. Please ensure you've granted camera permissions."
      );
      setPermissionState('denied');
      setIsProcessing(false);
    }
  };

  // Stop the camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setStream(null);
      setCameraActive(false);
    }
  };

  // Flip between front and rear cameras
  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    // Restart camera with new facing mode
    setTimeout(startCamera, 300);
  };

  // Apply digital zoom
  const applyZoom = (zoomLevel: number) => {
    const videoTrack = stream?.getVideoTracks()[0];
    if (!videoTrack) return;

    // First apply CSS zoom for universal support
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${zoomLevel})`;
      videoRef.current.style.transformOrigin = 'center';
    }

    // Then try hardware zoom if supported
    try {
      const capabilities = videoTrack.getCapabilities?.();
      if (capabilities && 'zoom' in capabilities) {
        const constraints = {} as any; // Use type assertion for zoom constraint
        constraints.zoom = zoomLevel;
        videoTrack.applyConstraints(constraints).catch(e => {
          console.log("Could not apply zoom constraint, using CSS zoom only:", e);
        });
      }
    } catch (error) {
      console.error("Error applying zoom:", error);
    }
  };

  // Change zoom level
  const handleZoomChange = (zoomIndex: number) => {
    setCurrentZoomIndex(zoomIndex);
    applyZoom(ZOOM_LEVELS[zoomIndex]);
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
  };
}
