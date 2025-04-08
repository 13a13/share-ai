
import React, { useRef, useState } from "react";
import { Camera, Image, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import LoadingSpinner from "./ui/LoadingSpinner";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  isProcessing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use the back camera on mobile devices
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setErrorMessage(null);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setErrorMessage(
        "Could not access camera. Please ensure you've granted camera permissions."
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Match canvas dimensions to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL (jpeg format with 90% quality)
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    
    // Stop the camera stream
    stopCamera();
    
    // Send the image data to the parent component
    onCapture(imageData);
  };

  React.useEffect(() => {
    // Clean up camera on component unmount
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black text-white">
        <h2 className="text-xl font-semibold">Take Photo</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          className="text-white hover:bg-gray-800"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="relative flex-grow flex items-center justify-center bg-black">
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
        ) : cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-h-full max-w-full"
          />
        ) : (
          <div className="text-white text-center p-4">
            <Button 
              onClick={startCamera}
              className="bg-shareai-teal hover:bg-shareai-teal/90 mb-4"
            >
              <Camera className="h-5 w-5 mr-2" />
              Open Camera
            </Button>
            <p className="text-sm text-gray-400">
              Grant camera permissions when prompted
            </p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {cameraActive && (
        <div className="p-4 bg-black">
          <Button
            onClick={takePhoto}
            disabled={isProcessing}
            className="w-full py-6 bg-shareai-teal hover:bg-shareai-teal/90 text-lg"
          >
            {isProcessing ? (
              <LoadingSpinner size="sm" text="Processing..." />
            ) : (
              <>
                <Camera className="h-6 w-6 mr-2" />
                Capture Photo
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
