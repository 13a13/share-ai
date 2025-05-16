
import { useState, useCallback } from "react";
import { compressDataURLImage } from "@/utils/imageCompression";

/**
 * Hook to manage photo capture from a video stream
 */
export const useCameraCapture = (videoRef: React.RefObject<HTMLVideoElement>, isReady: boolean) => {
  const [isCapturing, setIsCapturing] = useState(false);

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
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
  }, [isReady, videoRef]);

  return {
    isCapturing,
    takePhoto
  };
};
