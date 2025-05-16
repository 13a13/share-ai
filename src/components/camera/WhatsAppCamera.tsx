
import React, { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { compressDataURLImage } from "@/utils/imageCompression";
import CapturedPhotosGallery from "./CapturedPhotosGallery";
import CameraHeader from "./CameraHeader";
import CameraView from "./CameraView";
import CameraControls from "./CameraControls";
import { useCameraControl } from "@/hooks/useCameraControl";

interface WhatsAppCameraProps {
  onClose: () => void;
  onPhotosCapture: (photos: string[]) => void;
  maxPhotos?: number;
}

const WhatsAppCamera = ({ onClose, onPhotosCapture, maxPhotos = 20 }: WhatsAppCameraProps) => {
  const { toast } = useToast();
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use our camera control hook
  const {
    videoRef,
    isCameraActive,
    errorMessage,
    isProcessing,
    hasMultipleCameras,
    permissionState,
    currentZoomIndex,
    ZOOM_LEVELS,
    checkMultipleCameras,
    checkCameraPermission,
    startCamera,
    switchCamera,
    handleZoomChange,
    setIsProcessing
  } = useCameraControl({ maxPhotos });

  // Initialize camera on component mount and handle cleanup
  useEffect(() => {
    // Check for cameras and permissions
    checkMultipleCameras();
    checkCameraPermission();
    
    // Automatic initialization after a short delay if needed
    const initTimeout = setTimeout(() => {
      if (!isCameraActive && !isProcessing && !errorMessage) {
        console.log("Attempting automatic camera initialization");
        startCamera();
      }
    }, 1000);
    
    // Return cleanup function
    return () => {
      clearTimeout(initTimeout);
    };
  }, []);

  // Take a photo
  const takePhoto = async () => {
    if (!canvasRef.current || !videoRef.current || capturedPhotos.length >= maxPhotos) return;
    
    setIsProcessing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Could not get canvas context");
      }
      
      console.log("Taking photo with dimensions:", video.videoWidth, "x", video.videoHeight);
      
      // Make sure we have valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error("Invalid video dimensions:", video.videoWidth, video.videoHeight);
        throw new Error("Camera not ready. Please try again.");
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Compress the image before adding it to captured photos
      const compressedDataUrl = await compressDataURLImage(imageDataUrl, `camera-${Date.now()}.jpg`);
      
      // Add to captured photos
      setCapturedPhotos(prev => [...prev, compressedDataUrl]);
      
      // Alert user
      if (capturedPhotos.length + 1 === maxPhotos) {
        toast({
          title: "Maximum photos reached",
          description: `You've reached the maximum of ${maxPhotos} photos.`,
        });
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Error capturing photo",
        description: "There was a problem capturing your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove a photo from captured photos
  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Complete the photo capture process and pass photos back to parent
  const handleDone = () => {
    if (capturedPhotos.length === 0) {
      toast({
        title: "No photos captured",
        description: "Please take at least one photo before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    onPhotosCapture(capturedPhotos);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <CameraHeader 
        onClose={onClose}
        onDone={handleDone}
        hasCapturedPhotos={capturedPhotos.length > 0}
      />

      {/* Captured Photos Gallery */}
      {capturedPhotos.length > 0 && (
        <CapturedPhotosGallery 
          photos={capturedPhotos} 
          onRemovePhoto={removePhoto} 
        />
      )}

      {/* Camera View */}
      <div className="relative flex-grow flex items-center justify-center bg-black overflow-hidden">
        <CameraView
          errorMessage={errorMessage}
          isCameraActive={isCameraActive}
          isProcessing={isProcessing}
          permissionState={permissionState}
          videoRef={videoRef}
          zoomLevels={ZOOM_LEVELS}
          currentZoomIndex={currentZoomIndex}
          onZoomChange={handleZoomChange}
          onStartCamera={startCamera}
        />

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Footer with controls */}
      <CameraControls 
        isCameraActive={isCameraActive}
        isProcessing={isProcessing}
        hasMultipleCameras={hasMultipleCameras}
        capturedPhotos={capturedPhotos}
        maxPhotos={maxPhotos}
        onTakePhoto={takePhoto}
        onSwitchCamera={switchCamera}
      />
    </div>
  );
};

export default WhatsAppCamera;
