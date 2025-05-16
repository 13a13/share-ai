
import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCamera } from "@/hooks/useCamera";
import CameraHeader from "./CameraHeader";
import CameraContent from "./CameraContent";
import CameraFooter from "./CameraFooter";

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
  const isMobile = useIsMobile();
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

  // Render wrapper for camera components
  const renderCameraComponents = () => (
    <>
      <CameraHeader 
        title={title} 
        onClose={onClose} 
        onFlipCamera={flipCamera}
        isReady={isReady} 
      />
      
      <CameraContent
        videoRef={videoRef}
        isReady={isReady}
        isProcessing={isProcessing}
        errorMessage={errorMessage}
        permissionState={permissionState}
        facingMode={facingMode}
        capturedPhotos={capturedPhotos}
        onClose={onClose}
        onDeletePhoto={handleDeletePhoto}
      />
      
      <CameraFooter
        capturedPhotos={capturedPhotos}
        maxPhotos={maxPhotos}
        isReady={isReady}
        isCapturing={isCapturing}
        onCapture={handleCapture}
        onConfirm={handleConfirm}
      />
    </>
  );

  // Use Sheet for mobile and Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={open => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="p-0 h-[100dvh] max-h-[100dvh] bg-black text-white"
        >
          {renderCameraComponents()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-full sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw] w-full h-[90vh] p-0 bg-black text-white"
      >
        {renderCameraComponents()}
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;
