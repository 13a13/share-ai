
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
  open: boolean;
  onClose: () => void;
  onPhotosCapture: (photos: string[]) => void;
  maxPhotos?: number;
  title?: string;
}

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
  const [isCapturingSequence, setIsCapturingSequence] = useState(false);
  
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
      setIsCapturingSequence(false);
    }
  }, [open, stopCamera]);

  // Enhanced screen orientation handling
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

  // Enhanced photo capture with better feedback
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
      setIsCapturingSequence(true);
      const photoUrl = await takePhoto();
      
      setCapturedPhotos(prev => {
        const newPhotos = [...prev, photoUrl];
        
        // Show success feedback
        toast({
          title: `Photo ${newPhotos.length} captured`,
          description: `${maxPhotos - newPhotos.length} photos remaining`,
          duration: 1500,
        });
        
        return newPhotos;
      });
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Failed to take photo",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingSequence(false);
    }
  }, [capturedPhotos.length, maxPhotos, takePhoto, toast]);

  // Enhanced photo deletion with confirmation for last photo
  const handleDeletePhoto = useCallback((index: number) => {
    setCapturedPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      
      if (newPhotos.length === 0) {
        toast({
          title: "All photos deleted",
          description: "You can start capturing photos again",
          duration: 2000,
        });
      } else {
        toast({
          title: "Photo deleted",
          description: `${newPhotos.length} photos remaining`,
          duration: 1500,
        });
      }
      
      return newPhotos;
    });
  }, [toast]);

  // Enhanced confirmation with photo count validation
  const handleConfirm = useCallback(() => {
    if (capturedPhotos.length === 0) {
      toast({
        title: "No photos to save",
        description: "Please capture at least one photo before continuing.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Photos saved successfully",
      description: `${capturedPhotos.length} photos are being processed`,
      duration: 2000,
    });
    
    onPhotosCapture(capturedPhotos);
    onClose();
  }, [capturedPhotos, onClose, onPhotosCapture, toast]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && isReady && capturedPhotos.length < maxPhotos) {
        event.preventDefault();
        handleCapture();
      } else if (event.code === 'Enter' && capturedPhotos.length > 0) {
        event.preventDefault();
        handleConfirm();
      } else if (event.code === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, isReady, capturedPhotos.length, maxPhotos, handleCapture, handleConfirm, onClose]);

  // Enhanced camera components with better props
  const renderCameraComponents = () => (
    <>
      <CameraHeader 
        title={`${title} (${capturedPhotos.length}/${maxPhotos})`}
        onClose={onClose} 
        onFlipCamera={flipCamera}
        isReady={isReady} 
      />
      
      <CameraContent
        videoRef={videoRef}
        isReady={isReady}
        isProcessing={isProcessing || isCapturingSequence}
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
        isCapturing={isCapturing || isCapturingSequence}
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
        className="fixed left-[50%] top-[50%] z-50 grid w-[80vw] max-w-2xl h-[75vh] max-h-[600px] translate-x-[-50%] translate-y-[-50%] p-0 bg-black text-white border-0 rounded-lg shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
      >
        {renderCameraComponents()}
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;
