
import { useRef, useState, useCallback } from "react";

interface UseCameraStreamOptions {
  facingMode: 'user' | 'environment';
  timeoutMs?: number;
}

export const useCameraStream = (options: UseCameraStreamOptions) => {
  const { facingMode, timeoutMs = 3000 } = options;
  
  // Stream management
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Stream state
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check browser compatibility
  const checkBrowserCompatibility = useCallback(() => {
    if (!navigator.mediaDevices) {
      console.error("❌ navigator.mediaDevices not available");
      return false;
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      console.error("❌ getUserMedia not available");
      return false;
    }
    
    console.log("✅ Browser supports modern camera API");
    return true;
  }, []);

  // Stops all tracks in the current stream and cleans up resources
  const stopStream = useCallback(() => {
    console.log("🛑 Stopping camera stream");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`🛑 Stopping track: ${track.kind}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsReady(false);
  }, []);

  // Starts the camera with the specified facing mode
  const startStream = useCallback(async (permissionGranted: boolean = true) => {
    console.log(`🎥 Starting camera stream with facing mode: ${facingMode}`);
    
    // Check browser compatibility first
    if (!checkBrowserCompatibility()) {
      setErrorMessage("Your browser doesn't support camera access. Please use a modern browser like Chrome, Firefox, or Safari.");
      setIsProcessing(false);
      return;
    }
    
    // Clean up any existing stream first
    stopStream();
    
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (!permissionGranted) {
        throw new Error("Camera permission denied");
      }

      // Primary constraints with preferred facing mode
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log("📋 Camera constraints:", constraints);

      // Set up timeout for camera initialization
      const timeoutPromise = new Promise<MediaStream>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          console.warn("⏰ Camera initialization timeout");
          setIsProcessing(false); // Stop the spinner even if we don't have video yet
          reject(new Error("Camera initialization timeout"));
        }, timeoutMs);
      });

      let stream: MediaStream;

      try {
        // Try to get the stream with the preferred constraints
        console.log("🎯 Attempting to get camera stream with preferred constraints");
        stream = await Promise.race([
          navigator.mediaDevices.getUserMedia(constraints),
          timeoutPromise
        ]);
        console.log("✅ Camera stream obtained with preferred constraints");
      } catch (error: any) {
        console.warn("⚠️ Initial camera constraint failed:", error);
        
        // If we got an OverconstrainedError, retry with basic constraints
        if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
          console.log("🔄 Retrying with basic constraints");
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false
          });
          console.log("✅ Camera stream obtained with basic constraints");
        } else {
          throw error;
        }
      }

      // Clear the timeout if it hasn't fired yet
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Store the stream and set up the video element
      streamRef.current = stream;
      
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }
      
      console.log("📺 Setting up video element");
      videoRef.current.srcObject = stream;

      // Set up event listeners for video readiness
      const handleVideoReady = () => {
        console.log("✅ Video ready for capture");
        setIsReady(true);
        setIsProcessing(false);
        setErrorMessage(null);
        
        if (videoRef.current) {
          videoRef.current.removeEventListener('canplay', handleVideoReady);
        }
      };

      const handleVideoError = (event: Event) => {
        console.error("❌ Video error:", event);
        setErrorMessage("Failed to initialize video. Please try again.");
        setIsProcessing(false);
      };

      videoRef.current.addEventListener('canplay', handleVideoReady);
      videoRef.current.addEventListener('error', handleVideoError);
      
      // Automatically attempt to play the video
      try {
        console.log("▶️ Starting video playback");
        await videoRef.current.play();
        console.log("✅ Video playback started");
      } catch (playError: any) {
        console.warn("⚠️ Auto-play failed (this is normal on some browsers):", playError);
        // This is OK - user may need to interact first on some browsers
      }

    } catch (error: any) {
      console.error("❌ Camera initialization error:", error);
      
      let friendlyMessage = "Failed to access camera. Please check permissions.";
      
      // Handle specific error cases with better messaging
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        friendlyMessage = "Camera access denied. Please enable camera permission in your browser settings and refresh the page.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        friendlyMessage = "No camera detected. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        friendlyMessage = "Camera is in use by another application. Please close other apps using the camera.";
      } else if (error.name === "SecurityError") {
        friendlyMessage = "Camera access blocked by browser security. Please use HTTPS or allow camera access.";
      } else if (error.message === "Camera initialization timeout") {
        friendlyMessage = "Camera took too long to start. Please try again.";
      }
      
      setErrorMessage(friendlyMessage);
      setIsProcessing(false);
      setIsReady(false);
    }
  }, [facingMode, stopStream, timeoutMs, checkBrowserCompatibility]);

  return {
    videoRef,
    streamRef,
    isReady,
    isProcessing,
    errorMessage,
    startStream,
    stopStream,
    setIsProcessing,
    setErrorMessage,
  };
};
