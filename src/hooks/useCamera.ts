
import { useRef, useState, useCallback, useEffect } from "react";
import { compressDataURLImage } from "@/utils/imageCompression";

/**
 * Zoom levels for the camera (0.5x, 1x, 2x, 3x)
 * Only levels supported by the device will be shown
 */
const DEFAULT_ZOOM_LEVELS = [0.5, 1, 2, 3];

/**
 * Hook to manage camera functionality including stream initialization,
 * photo capture, zoom controls, and camera switching
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.initialFacingMode='environment'] - Initial camera facing mode
 * @param {number} [options.timeoutMs=3000] - Timeout for camera initialization
 * @returns Camera control methods and state
 */
export const useCamera = (options = {}) => {
  const {
    initialFacingMode = 'environment',
    timeoutMs = 3000,
  } = options;

  // Core refs and state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Camera state management
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    initialFacingMode as 'user' | 'environment'
  );
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Zoom functionality
  const [supportedZoomLevels, setSupportedZoomLevels] = useState<number[]>([1]);
  const [currentZoomIndex, setCurrentZoomIndex] = useState(0);

  /**
   * Checks which zoom levels are supported by the device and sets the available options
   */
  const detectSupportedZoomLevels = useCallback((track: MediaStreamTrack) => {
    // Default to just 1x zoom
    let zoomLevels = [1]; 
    
    try {
      const capabilities = track.getCapabilities?.();
      if (capabilities?.zoom) {
        const { min, max } = capabilities.zoom;
        // Only include zoom levels that are supported by the device
        zoomLevels = DEFAULT_ZOOM_LEVELS.filter(level => 
          level >= (min || 0.5) && level <= (max || 3)
        );
        // Ensure we always have at least 1x zoom
        if (!zoomLevels.includes(1)) {
          zoomLevels.push(1);
          zoomLevels.sort((a, b) => a - b);
        }
      }
    } catch (error) {
      console.warn("Failed to detect zoom capabilities:", error);
    }
    
    setSupportedZoomLevels(zoomLevels);
    // Set initial zoom to 1x or closest available
    const defaultIndex = zoomLevels.indexOf(1);
    setCurrentZoomIndex(defaultIndex >= 0 ? defaultIndex : 0);
    
    return zoomLevels;
  }, []);

  /**
   * Applies the specified zoom level to the camera
   */
  const applyZoom = useCallback((zoom: number) => {
    if (!streamRef.current || !videoRef.current) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return;

      // Try hardware zoom first
      if (track.getCapabilities?.()?.zoom) {
        track.applyConstraints({ 
          advanced: [{ zoom }] 
        }).catch(() => {
          // Silently fail and fall back to CSS zoom
        });
      }
      
      // Always apply CSS zoom as a fallback or enhancement
      if (videoRef.current) {
        videoRef.current.style.transform = `scale(${zoom})`;
        videoRef.current.style.transformOrigin = 'center';
      }
    } catch (error) {
      console.warn("Error applying zoom:", error);
    }
  }, []);

  /**
   * Changes the zoom level to the specified index in the supportedZoomLevels array
   */
  const zoomTo = useCallback((index: number) => {
    if (index < 0 || index >= supportedZoomLevels.length) return;
    
    setCurrentZoomIndex(index);
    applyZoom(supportedZoomLevels[index]);
  }, [applyZoom, supportedZoomLevels]);

  /**
   * Stops all tracks in the current stream and cleans up resources
   */
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

  /**
   * Starts the camera with the specified facing mode
   */
  const startCamera = useCallback(async () => {
    // Clean up any existing stream first
    stopStream();
    
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Check permissions if the API is available
      try {
        if (navigator.permissions) {
          const permResult = await navigator.permissions.query({ name: 'camera' as any });
          setPermissionState(permResult.state as any);
          
          if (permResult.state === 'denied') {
            throw new Error("Camera permission denied");
          }
        }
      } catch (permError) {
        // Ignore permission query errors, we'll try getUserMedia anyway
        console.warn("Permission query failed:", permError);
      }

      // Primary constraints with preferred facing mode
      const constraints = {
        video: {
          facingMode: { ideal: facingMode }
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
      
      // Detect zoom capabilities and set initial zoom
      const track = stream.getVideoTracks()[0];
      if (track) {
        const zoomLevels = detectSupportedZoomLevels(track);
        // Apply initial zoom level
        applyZoom(zoomLevels[currentZoomIndex]);
      }

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
  }, [facingMode, stopStream, timeoutMs, applyZoom, detectSupportedZoomLevels, currentZoomIndex]);

  /**
   * Captures a photo from the current video stream
   * @returns Promise resolving to a base64 data URL of the captured image
   */
  const takePhoto = useCallback(async (): Promise<string> => {
    if (!videoRef.current || !isReady) {
      throw new Error("Camera not ready");
    }

    try {
      setIsCapturing(true);
      
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not create canvas context");
      }
      
      // Draw the current video frame to the canvas
      ctx.drawImage(video, 0, 0);
      
      // Get the data URL and try to compress it
      const rawDataUrl = canvas.toDataURL('image/jpeg');
      let finalDataUrl: string;
      
      try {
        // Generate a unique filename with timestamp
        const timestamp = new Date().getTime();
        const filename = `photo-${timestamp}.jpg`;
        
        // Compress the image
        finalDataUrl = await compressDataURLImage(rawDataUrl, filename);
      } catch (compressionError) {
        console.warn("Image compression failed:", compressionError);
        // Fall back to uncompressed image
        finalDataUrl = rawDataUrl;
      }
      
      return finalDataUrl;
    } finally {
      setIsCapturing(false);
    }
  }, [isReady]);

  /**
   * Switches between front and back cameras
   */
  const flipCamera = useCallback(() => {
    setFacingMode(current => current === 'environment' ? 'user' : 'environment');
    // Camera will restart in useEffect when facingMode changes
  }, []);

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
    
    // Zoom controls
    zoomLevels: supportedZoomLevels,
    currentZoomIndex,
    zoomTo,
    
    // Camera controls
    startCamera,
    stopCamera: stopStream,
    flipCamera,
    takePhoto,
  };
};
