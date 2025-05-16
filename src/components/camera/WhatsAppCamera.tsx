import React, { useRef, useState, useEffect } from "react";
import { Camera, X, ZoomIn, ZoomOut, Check, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressDataURLImage } from "@/utils/imageCompression";
import { useToast } from "@/hooks/use-toast";
import CapturedPhotosGallery from "./CapturedPhotosGallery";
import ZoomControls from "./ZoomControls";

interface WhatsAppCameraProps {
  onClose: () => void;
  onPhotosCapture: (photos: string[]) => void;
  maxPhotos?: number;
}

const ZOOM_LEVELS = [0.5, 1, 2, 3];

const WhatsAppCamera = ({ onClose, onPhotosCapture, maxPhotos = 20 }: WhatsAppCameraProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentZoomIndex, setCurrentZoomIndex] = useState(1); // Default to 1x zoom (index 1)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  const currentZoom = ZOOM_LEVELS[currentZoomIndex];

  // Initialize camera when component mounts
  useEffect(() => {
    startCamera();
    checkMultipleCameras();
    
    // Clean up when component unmounts
    return () => {
      stopCamera();
    };
  }, [facingMode]);
  
  // Check if device has multiple cameras
  const checkMultipleCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error) {
      console.error("Error checking for multiple cameras:", error);
    }
  };

  // Start the camera with current settings
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      setIsProcessing(true);
      
      // Get user media with appropriate constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setErrorMessage(
        "Could not access camera. Please ensure you've granted camera permissions."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Stop the camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setStream(null);
      setCameraActive(false);
    }
  };

  // Flip between front and rear cameras
  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Apply digital zoom
  const applyZoom = (zoomLevel: number) => {
    const videoTrack = stream?.getVideoTracks()[0];
    if (!videoTrack || !('getConstraints' in videoTrack)) return;

    // Try to apply zoom using CSS scaling instead of constraints
    // This is more widely supported across browsers
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${zoomLevel})`;
      videoRef.current.style.transformOrigin = 'center';
    }

    // Some browsers support zoom through constraints
    try {
      const capabilities = videoTrack.getCapabilities();
      if (capabilities && 'zoom' in capabilities) {
        // Create a properly typed constraint object
        const zoomConstraints: MediaTrackConstraints = {};
        
        // Only set zoom if the camera supports it
        if ('zoom' in capabilities) {
          zoomConstraints.zoom = zoomLevel;
          videoTrack.applyConstraints(zoomConstraints);
        }
      }
    } catch (error) {
      console.error("Error applying zoom:", error);
    }
  };

  // Change zoom level
  const handleZoomChange = (zoomIndex: number) => {
    setCurrentZoomIndex(zoomIndex);
    applyZoom(ZOOM_LEVELS[zoomIndex]);
  };

  // Take a photo
  const takePhoto = async () => {
    if (!canvasRef.current || !videoRef.current || capturedPhotos.length >= maxPhotos) return;
    
    setIsProcessing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
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
        description: "There was a problem capturing your photo.",
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
      <div className="flex justify-between items-center p-4 bg-black text-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-gray-800"
        >
          <X className="h-6 w-6" />
        </Button>
        <h2 className="text-xl font-semibold">Camera</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDone}
          disabled={capturedPhotos.length === 0}
          className="text-white hover:bg-gray-800"
        >
          <Check className="h-6 w-6" />
        </Button>
      </div>

      {/* Captured Photos Gallery */}
      {capturedPhotos.length > 0 && (
        <CapturedPhotosGallery 
          photos={capturedPhotos} 
          onRemovePhoto={removePhoto} 
        />
      )}

      {/* Camera View */}
      <div className="relative flex-grow flex items-center justify-center bg-black overflow-hidden">
        {errorMessage ? (
          <div className="text-white text-center p-4">
            <p className="mb-4">{errorMessage}</p>
            <Button
              onClick={startCamera}
              className="bg-shareai-teal hover:bg-shareai-teal/90"
            >
              Try Again
            </Button>
          </div>
        ) : isCameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-h-full max-w-full object-cover transform"
            />
            {/* Zoom controls */}
            <ZoomControls
              zoomLevels={ZOOM_LEVELS}
              currentZoomIndex={currentZoomIndex}
              onZoomChange={handleZoomChange}
            />
          </>
        ) : (
          <div className="text-white text-center p-4">
            <Button
              onClick={startCamera}
              className="bg-shareai-teal hover:bg-shareai-teal/90 mb-4"
            >
              <Camera className="h-5 w-5 mr-2" />
              Open Camera
            </Button>
            <p className="text-sm text-gray-400">Grant camera permissions when prompted</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Footer with controls */}
      {isCameraActive && (
        <div className="p-4 bg-black">
          <div className="flex items-center justify-between">
            {/* Camera switch button (only show if multiple cameras detected) */}
            <div className="w-12">
              {hasMultipleCameras && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="text-white hover:bg-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 7h.01"></path>
                    <rect width="18" height="14" x="3" y="3" rx="2"></rect>
                    <path d="m9 11 3-3 3 3"></path>
                    <path d="M12 14v-6"></path>
                  </svg>
                </Button>
              )}
            </div>
            
            {/* Shutter button */}
            <Button
              onClick={takePhoto}
              disabled={isProcessing || capturedPhotos.length >= maxPhotos}
              size="icon"
              className={`rounded-full w-16 h-16 ${
                isProcessing
                  ? "bg-gray-600"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              {isProcessing ? (
                <div className="h-14 w-14 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
              ) : (
                <div className="h-14 w-14 rounded-full border-4 border-gray-900"></div>
              )}
            </Button>
            
            {/* Empty space to balance layout */}
            <div className="w-12"></div>
          </div>
          
          {/* Photos counter */}
          <div className="text-white text-center mt-4 text-sm">
            {capturedPhotos.length}/{maxPhotos} photos
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppCamera;
