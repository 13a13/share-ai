
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useCamera } from "@/hooks/useCamera";
import Shutter from "./Shutter";
import ThumbnailStrip from "./ThumbnailStrip";
import ZoomButtons from "./ZoomButtons";

interface CameraModalProps {
  /**
   * Whether the camera modal is open
   */
  open: boolean;
  
  /**
   * Function called when the camera modal is closed without capturing photos
   */
  onClose: () => void;
  
  /**
   * Function called when photos are captured and confirmed
   * @param photos Array of data URLs of captured photos
   */
  onPhotosCapture: (photos: string[]) => void;
  
  /**
   * Maximum number of photos that can be taken (default: 20)
   */
  maxPhotos?: number;
  
  /**
   * Title to show in the camera header
   */
  title?: string;
}

/**
 * A modal with camera functionality for capturing multiple photos
 */
const CameraModal: React.FC<CameraModalProps> = ({
  open,
  onClose,
  onPhotosCapture,
  maxPhotos = 20,
  title = "Camera"
}) => {
  const isMobile = useMobile();
  const { toast } = useToast();
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  
  const {
    videoRef,
    isReady,
    isProcessing,
    isCapturing,
    errorMessage,
    permissionState,
    facingMode,
    zoomLevels,
    currentZoomIndex,
    zoomTo,
    flipCamera,
    takePhoto,
    stopCamera
  } = useCamera({ initialFacingMode: 'environment', timeoutMs: 3000 });

  // Clean up when the modal is closed
  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedPhotos([]);
    }
  }, [open, stopCamera]);

  // Lock screen orientation on mobile
  useEffect(() => {
    if (isMobile && open && 'screen' in window && 'orientation' in screen) {
      try {
        (screen.orientation as any).lock('portrait').catch((err: any) => {
          console.warn("Could not lock screen orientation:", err);
        });
      } catch (err) {
        console.warn("Orientation API not supported:", err);
      }
    }

    return () => {
      if ('screen' in window && 'orientation' in screen) {
        try {
          (screen.orientation as any).unlock();
        } catch (err) {
          // Ignore
        }
      }
    };
  }, [isMobile, open]);

  // Handle taking a photo
  const handleCapture = useCallback(async () => {
    if (capturedPhotos.length >= maxPhotos) {
      toast({
        title: "Maximum photos reached",
        description: `You can capture up to ${maxPhotos} photos at once.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const photoUrl = await takePhoto();
      setCapturedPhotos(prev => [...prev, photoUrl]);
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Failed to take photo",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [capturedPhotos.length, maxPhotos, takePhoto, toast]);

  // Handle deleting a photo
  const handleDeletePhoto = useCallback((index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle confirming the captured photos
  const handleConfirm = useCallback(() => {
    onPhotosCapture(capturedPhotos);
    onClose();
  }, [capturedPhotos, onClose, onPhotosCapture]);

  // Render different states based on permissions and errors
  const renderCameraContent = () => {
    // Show error state
    if (errorMessage) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
          <p className="mb-4">{errorMessage}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-white text-black hover:bg-white/90 mb-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Reload Page
          </Button>
          <Button 
            variant="outline"
            onClick={onClose}
            className="border-white text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      );
    }

    // Show permission denied state
    if (permissionState === 'denied') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
          <p className="mb-4">
            Camera access denied. Please enable camera permissions in your browser settings and try again.
          </p>
          <Button 
            onClick={onClose}
            className="bg-white text-black hover:bg-white/90"
          >
            Close
          </Button>
        </div>
      );
    }

    // Show loading state or camera view
    return (
      <div className="relative flex flex-col h-full">
        {/* Camera view */}
        <div className="relative flex-1 bg-black overflow-hidden">
          {/* Video element */}
          <div 
            className={`absolute inset-0 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            style={{ 
              // Apply in-line styles for orientation 
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline 
              muted
              className="h-full w-full object-cover"
            />
          </div>

          {/* Loading overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <p className="text-white text-lg">Accessing camera...</p>
            </div>
          )}

          {/* Zoom buttons */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
            <ZoomButtons 
              zoomLevels={zoomLevels}
              currentIndex={currentZoomIndex}
              onZoomChange={zoomTo}
            />
          </div>

          {/* Thumbnail strip */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <ThumbnailStrip 
              photos={capturedPhotos} 
              onDelete={handleDeletePhoto} 
            />
          </div>
        </div>

        {/* Footer with shutter and counter */}
        <div className="bg-black p-4 flex flex-col items-center">
          {/* Counter */}
          <div className="text-white/80 text-sm mb-2">
            {capturedPhotos.length} / {maxPhotos} photos
          </div>

          {/* Shutter button */}
          <Shutter 
            onCapture={handleCapture} 
            isCapturing={isCapturing}
            disabled={!isReady || capturedPhotos.length >= maxPhotos}
          />
        </div>
      </div>
    );
  };

  // Render header with title, close and confirm buttons
  const renderHeader = () => (
    <div className="flex items-center justify-between bg-black text-white p-4">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onClose} 
        className="rounded-full hover:bg-white/10"
        aria-label="Close camera"
      >
        <X className="h-6 w-6" />
      </Button>

      <h2 className="text-lg font-medium">{title}</h2>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-white/10"
        onClick={flipCamera}
        disabled={!isReady}
        aria-label="Switch camera"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
    </div>
  );

  // Render confirm button (visible when photos are captured)
  const renderConfirmButton = () => {
    if (capturedPhotos.length === 0) {
      return null;
    }

    return (
      <Button
        className="absolute bottom-4 right-4 rounded-full bg-white text-black hover:bg-white/90 z-20"
        onClick={handleConfirm}
        aria-label="Confirm photos"
      >
        <Check className="h-5 w-5 mr-2" />
        Done
      </Button>
    );
  };

  // Use Sheet for mobile and Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={open => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="p-0 h-[100dvh] max-h-[100dvh] bg-black text-white"
        >
          {renderHeader()}
          {renderCameraContent()}
          {renderConfirmButton()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-full sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw] w-full h-[90vh] p-0 bg-black text-white"
        hideCloseButton
      >
        {renderHeader()}
        {renderCameraContent()}
        {renderConfirmButton()}
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;
