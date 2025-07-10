
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import CameraHeader from "./CameraHeader";
import CameraContent from "./CameraContent";
import CameraFooter from "./CameraFooter";

interface CameraContainerProps {
  onClose: () => void;
  onPhotosCapture: (photos: string[]) => void;
  maxPhotos: number;
  title: string;
}

const CameraContainer: React.FC<CameraContainerProps> = ({
  onClose,
  onPhotosCapture,
  maxPhotos,
  title
}) => {
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

  // Clean up when the container unmounts
  useEffect(() => {
    return () => {
      stopCamera();
      setCapturedPhotos([]);
      setIsCapturingSequence(false);
    };
  }, [stopCamera]);

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
  }, [isReady, capturedPhotos.length, maxPhotos, handleCapture, handleConfirm, onClose]);

  return (
    <div className="flex flex-col h-full w-full">
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
    </div>
  );
};

export default CameraContainer;
