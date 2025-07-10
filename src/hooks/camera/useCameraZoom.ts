
import { useState, useCallback } from "react";

export const useCameraZoom = (streamRef: React.RefObject<MediaStream | null>, videoRef: React.RefObject<HTMLVideoElement>) => {
  const ZOOM_LEVELS = [1, 2, 3, 4];
  const [currentZoomIndex, setCurrentZoomIndex] = useState(0); // Default to 1x zoom (index 0)

  // Apply digital zoom
  const applyZoom = useCallback((zoomLevel: number) => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
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
  }, [streamRef, videoRef]);

  // Change zoom level
  const handleZoomChange = useCallback((zoomIndex: number) => {
    setCurrentZoomIndex(zoomIndex);
    applyZoom(ZOOM_LEVELS[zoomIndex]);
  }, [applyZoom]);

  return {
    ZOOM_LEVELS,
    currentZoomIndex,
    handleZoomChange,
    applyZoom,
  };
};
