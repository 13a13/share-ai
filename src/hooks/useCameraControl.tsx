
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
  
  const ZOOM_LEVELS = [1, 2, 3, 4];
  const [currentZoomIndex, setCurrentZoomIndex] = useState(0); // Default to 1x zoom (index 0)

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
        
        // Only auto-start if we're definitely granted
        // (iOS Safari can return 'prompt' even after permission is granted)
        if (result.state === 'granted') {
          startCamera();
        }
      }
    } catch (error) {
      console.error("Error checking camera permission:", error);
      // Permissions API not available, we'll just try starting the camera directly
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
      
      // Get user media with appropriate constraints
      // We use "ideal" rather than "exact" for better compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
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
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      
      // Set up event listeners BEFORE attempting to play
      const videoEl = videoRef.current;
      
      // Create a function to handle successful camera initialization
      const handleVideoReady = () => {
        console.log("Video is ready and can play");
        setStream(mediaStream);
        setCameraActive(true);
        setIsProcessing(false);
        setPermissionState('granted');
        setErrorMessage(null); // camera is live, drop any old errors
        
        // Apply initial zoom level
        applyZoom(ZOOM_LEVELS[currentZoomIndex]);
        
        // Remove the event listeners
        videoEl.removeEventListener('canplay', handleVideoReady);
        videoEl.removeEventListener('loadedmetadata', handleVideoReady);
      };
      
      // Add event listeners for both canplay and loadedmetadata
      videoEl.addEventListener('canplay', handleVideoReady, { once: true });
      videoEl.addEventListener('loadedmetadata', handleVideoReady, { once: true });
      
      // Set a timeout to handle cases where events don't fire
      const timeoutId = setTimeout(() => {
        if (isProcessing) {
          console.log("Timeout reached - forcing camera activation");
          
          // Try to force play the video
          videoEl.play().catch(err => console.warn("Could not auto-play video:", err));
          
          // Force UI update even if play() fails
          setStream(mediaStream);
          setCameraActive(true);
          setIsProcessing(false);
          setPermissionState('granted');
          setErrorMessage(null); // camera is live, drop any old errors
          
          // Apply initial zoom
          applyZoom(ZOOM_LEVELS[currentZoomIndex]);
          
          // Remove event listeners if they haven't fired yet
          videoEl.removeEventListener('canplay', handleVideoReady);
          videoEl.removeEventListener('loadedmetadata', handleVideoReady);
        }
      }, 3000);
      
      // Start playing the video
      try {
        await videoEl.play();
        console.log("Video play() called successfully");
      } catch (playError) {
        console.warn("Error playing video initially:", playError);
        // We'll rely on the event listeners or timeout to handle this
      }
      
      return () => {
        clearTimeout(timeoutId);
        videoEl.removeEventListener('canplay', handleVideoReady);
        videoEl.removeEventListener('loadedmetadata', handleVideoReady);
      };
      
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
            
            // Setup event handling for fallback stream
            const videoEl = videoRef.current;
            
            const handleFallbackReady = () => {
              setStream(basicStream);
              setCameraActive(true);
              setIsProcessing(false);
              setPermissionState('granted');
              setErrorMessage(null); // camera is live, drop any old errors
              videoEl.removeEventListener('canplay', handleFallbackReady);
            };
            
            videoEl.addEventListener('canplay', handleFallbackReady, { once: true });
            
            // Try to play and set up fallback timeout
            videoEl.play().catch(e => console.warn("Could not auto-play fallback video:", e));
            
            setTimeout(() => {
              if (isProcessing) {
                setStream(basicStream);
                setCameraActive(true);
                setIsProcessing(false);
                setPermissionState('granted');
                setErrorMessage(null); // camera is live, drop any old errors
                videoEl.removeEventListener('canplay', handleFallbackReady);
              }
            }, 3000);
            
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
    setErrorMessage(null);
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    // Restart camera with new facing mode
    setTimeout(startCamera, 300);
  };

  // Apply digital zoom
  const applyZoom = (zoomLevel: number) => {
    if (!stream) return;
    
    const videoTrack = stream.getVideoTracks()[0];
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
        constraints.advanced = [{ zoom: zoomLevel }];
        videoTrack.applyConstraints(constraints).catch(e => {
          console.warn("Could not apply zoom constraint, using CSS zoom only:", e);
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
