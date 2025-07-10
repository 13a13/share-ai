
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

  // Stops all tracks in the current stream and cleans up resources
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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

      // Set up timeout for camera initialization
      const timeoutPromise = new Promise<MediaStream>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          setIsProcessing(false); // Stop the spinner even if we don't have video yet
          // Don't reject - we still want to wait for the stream
        }, timeoutMs);
      });

      // Try to get the stream with the preferred constraints
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        timeoutPromise
      ]).catch(async (error) => {
        console.warn("Initial camera constraint failed:", error);
        
        // If we got an OverconstrainedError, retry with basic constraints
        if (error.name === 'OverconstrainedError') {
          return navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false
          });
        }
        throw error;
      });

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
      
      videoRef.current.srcObject = stream;

      // Set up event listeners for video readiness
      const handleVideoReady = () => {
        setIsReady(true);
        setIsProcessing(false);
        setErrorMessage(null);
        
        if (videoRef.current) {
          videoRef.current.removeEventListener('canplay', handleVideoReady);
        }
      };

      videoRef.current.addEventListener('canplay', handleVideoReady);
      
      // Automatically attempt to play the video
      try {
        await videoRef.current.play();
      } catch (playError) {
        console.warn("Auto-play failed:", playError);
        // This is OK - user may need to interact first on some browsers
      }

    } catch (error) {
      console.error("Camera initialization error:", error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "Failed to access camera. Please check permissions."
      );
      setIsProcessing(false);
      setIsReady(false);
    }
  }, [facingMode, stopStream, timeoutMs]);

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
