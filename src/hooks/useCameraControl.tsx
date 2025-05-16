
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

  // Stop the camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setStream(null);
      setCameraActive(false);
    }
  };

  // Start the camera with current settings
  const startCamera = async () => {
    // First, stop any existing camera to ensure clean initialization
    stopCamera();
    
    try {
      setErrorMessage(null);
      setIsProcessing(true);
      setPermissionState('prompt');
      
      // Get user media with appropriate constraints
      // We use "ideal" rather than "exact" for better compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false
      };

      console.log("Starting camera with constraints:", constraints);
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Check if videoRef exists
      if (!videoRef.current) {
        console.error("Video element reference is not available");
        throw new Error("Camera element is not ready. Please try again.");
      }
      
      // Set the stream to video element
      console.log("Camera stream obtained, attaching to video element");
      videoRef.current.srcObject = mediaStream;
      
      // Ensure the video loads and plays
      videoRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded successfully");
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              console.log("Camera video is now playing");
              setStream(mediaStream);
              setCameraActive(true);
              setIsProcessing(false);
              setPermissionState('granted');
            })
            .catch(playError => {
              console.error("Error playing video:", playError);
              throw playError;
            });
        }
      };
      
      // Handle errors in video element
      videoRef.current.onerror = (event) => {
        console.error("Video element error:", event);
        setErrorMessage("Failed to display camera feed. Please try again.");
        setIsProcessing(false);
      };
      
      // Set a timeout to handle cases where onloadedmetadata doesn't fire
      const timeoutId = setTimeout(() => {
        if (isProcessing && videoRef.current) {
          console.log("Timeout reached - forcing camera activation");
          setStream(mediaStream);
          setCameraActive(true);
          setIsProcessing(false);
          setPermissionState('granted');
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
      
    } catch (error: any) {
      // Handle specific error cases
      console.error("Error accessing camera:", error);
      
      let friendlyMessage = "Could not access camera. Please ensure you've granted camera permissions.";
      
      // Handle specific error cases
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        friendlyMessage = "Camera access denied. Please enable camera permission in your browser settings.";
        setPermissionState('denied');
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        friendlyMessage = "No camera detected. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        friendlyMessage = "Camera is in use by another application. Please close other apps using the camera.";
      } else if (error.name === "OverconstrainedError") {
        friendlyMessage = "Camera doesn't support the requested settings. Trying with default settings...";
        // Fall back to basic constraints
        const basicConstraints = { 
          video: true, 
          audio: false 
        };
        
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            setStream(basicStream);
            setCameraActive(true);
            setIsProcessing(false);
            setPermissionState('granted');
            return; // Exit here since we've recovered
          }
        } catch (fallbackError) {
          console.error("Fallback camera access also failed:", fallbackError);
          friendlyMessage = "Could not access any camera. Please check your device.";
        }
      }
      
      setErrorMessage(friendlyMessage);
      setIsProcessing(false);
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
    setIsProcessing
  };
}
