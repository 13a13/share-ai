
import React, { useState, useCallback } from "react";
import { useCamera } from "@/hooks/useCamera";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw } from "lucide-react";
import ZoomButtons from "./ZoomButtons";
import ThumbnailStrip from "./ThumbnailStrip";
import Shutter from "./Shutter";
import CameraView from "./CameraView";

interface CameraModalProps {
  /**
   * Whether the camera modal is open
   */
  open: boolean;
  
  /**
   * Function called when the modal is closed
   */
  onClose: () => void;
  
  /**
   * Function called when photos are captured and confirmed
   */
  onPhotosCapture: (photos: string[]) => void;
  
  /**
   * Maximum number of photos that can be taken (default: 20)
   */
  maxPhotos?: number;
  
  /**
   * Title to show in the header (default: "Camera")
   */
  title?: string;
}

/**
 * A full-screen modal camera component that allows taking multiple photos
 * with zoom controls, thumbnail strip, and camera flipping.
 */
const CameraModal: React.FC<CameraModalProps> = ({
  open,
  onClose,
  onPhotosCapture,
  maxPhotos = 20,
  title = "Camera"
}) => {
  // Photos state
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  
  // Initialize camera hook
  const {
    videoRef,
    isReady,
    isProcessing,
    isCapturing,
    errorMessage,
    permissionState,
    zoomLevels,
    currentZoomIndex,
    zoomTo,
    startCamera,
    stopCamera,
    flipCamera,
    takePhoto
  } = useCamera();
  
  // Handle taking a photo
  const handleCapturePhoto = useCallback(async () => {
    if (capturedPhotos.length >= maxPhotos) return;
    
    try {
      const photoDataUrl = await takePhoto();
      setCapturedPhotos(prev => [...prev, photoDataUrl]);
    } catch (error) {
      console.error("Failed to capture photo:", error);
    }
  }, [capturedPhotos.length, maxPhotos, takePhoto]);
  
  // Remove a photo from the captured list
  const handleRemovePhoto = useCallback((index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Handle done button click
  const handleDone = useCallback(() => {
    if (capturedPhotos.length > 0) {
      onPhotosCapture(capturedPhotos);
      setCapturedPhotos([]);
    }
    onClose();
  }, [capturedPhotos, onClose, onPhotosCapture]);
  
  // Handle modal close
  const handleClose = useCallback(() => {
    setCapturedPhotos([]);
    onClose();
  }, [onClose]);
  
  // Clean up on close
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhotos([]);
      onClose();
    }
  }, [onClose, stopCamera]);

  return (
    <Sheet 
      open={open} 
      onOpenChange={handleOpenChange}
    >
      <SheetContent 
        side="bottom" 
        className="p-0 h-[100dvh] max-h-[100dvh] sm:max-w-full"
      >
        <div className="relative flex flex-col h-full bg-black">
          {/* Header */}
          <SheetHeader className="absolute top-0 left-0 right-0 z-10 px-4 py-3 flex flex-row items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white" 
              onClick={handleClose}
              aria-label="Close camera"
            >
              <X size={24} />
            </Button>
            
            <SheetTitle className="text-white text-center">
              {title}
            </SheetTitle>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={handleDone}
              disabled={capturedPhotos.length === 0}
              aria-label="Done"
            >
              <Check size={24} />
            </Button>
          </SheetHeader>
          
          {/* Camera view takes most of the space */}
          <div className="flex-1 relative overflow-hidden">
            <CameraView
              videoRef={videoRef}
              isReady={isReady}
              isProcessing={isProcessing}
              errorMessage={errorMessage}
              permissionState={permissionState}
              onStartCamera={startCamera}
            />
            
            {/* Zoom controls overlay at top */}
            {isReady && zoomLevels.length > 1 && (
              <div className="absolute top-16 left-0 right-0 flex justify-center">
                <ZoomButtons
                  zoomLevels={zoomLevels}
                  currentIndex={currentZoomIndex}
                  onZoomChange={zoomTo}
                />
              </div>
            )}
            
            {/* Thumbnail strip in middle */}
            {capturedPhotos.length > 0 && (
              <div className="absolute bottom-24 left-0 right-0">
                <ThumbnailStrip
                  photos={capturedPhotos}
                  onRemovePhoto={handleRemovePhoto}
                />
              </div>
            )}
          </div>
          
          {/* Footer with controls */}
          <div className="absolute bottom-0 left-0 right-0 flex-shrink-0 p-4 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex w-full items-center justify-between">
              <div className="w-14 flex items-center justify-center">
                {capturedPhotos.length > 0 && (
                  <span className="text-white text-sm">
                    {capturedPhotos.length} / {maxPhotos}
                  </span>
                )}
              </div>
              
              <Shutter
                disabled={!isReady || isCapturing || capturedPhotos.length >= maxPhotos}
                isCapturing={isCapturing}
                onCapture={handleCapturePhoto}
              />
              
              <div className="w-14 flex items-center justify-center">
                {isReady && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-full"
                    onClick={flipCamera}
                    aria-label="Flip camera"
                  >
                    <RotateCcw size={20} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CameraModal;
