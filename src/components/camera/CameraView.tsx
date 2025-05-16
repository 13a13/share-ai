
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import ZoomControls from "./ZoomControls";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface CameraViewProps {
  errorMessage: string | null;
  isCameraActive: boolean;
  isProcessing: boolean;
  permissionState: 'prompt' | 'granted' | 'denied';
  videoRef: React.RefObject<HTMLVideoElement>;
  zoomLevels: number[];
  currentZoomIndex: number;
  onZoomChange: (index: number) => void;
  onStartCamera: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({
  errorMessage,
  isCameraActive,
  isProcessing,
  permissionState,
  videoRef,
  zoomLevels,
  currentZoomIndex,
  onZoomChange,
  onStartCamera,
}) => {
  // Add effect for ensuring video plays once camera is active
  useEffect(() => {
    const playVideo = async () => {
      if (isCameraActive && videoRef.current && videoRef.current.paused) {
        try {
          await videoRef.current.play();
          console.log("Video playback started by effect");
        } catch (error) {
          console.error("Error auto-playing video:", error);
        }
      }
    };
    
    playVideo();
  }, [isCameraActive, videoRef]);

  if (errorMessage) {
    return (
      <div className="text-white text-center p-4 flex flex-col items-center justify-center h-full">
        <p className="mb-4">{errorMessage}</p>
        <Button
          onClick={() => onStartCamera()}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (isCameraActive) {
    return (
      <>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: `scale(${zoomLevels[currentZoomIndex]})` }}
        />
        <ZoomControls
          zoomLevels={zoomLevels}
          currentZoomIndex={currentZoomIndex}
          onZoomChange={onZoomChange}
        />
      </>
    );
  }

  if (isProcessing) {
    return (
      <div className="text-white text-center p-4 flex flex-col items-center justify-center h-full">
        <LoadingSpinner size="lg" className="mb-4 text-white" />
        <p>Accessing camera...</p>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className="text-white text-center p-4 flex flex-col items-center justify-center h-full">
        <p className="mb-4">Camera access denied. Please enable camera permission in your browser settings.</p>
        <Button
          onClick={() => onStartCamera()}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="text-white text-center p-4 flex flex-col items-center justify-center h-full">
      <Button
        onClick={onStartCamera}
        className="bg-shareai-teal hover:bg-shareai-teal/90 mb-4 flex items-center gap-2"
      >
        <Camera className="h-5 w-5" />
        Open Camera
      </Button>
      <p className="text-sm text-gray-400">Grant camera permissions when prompted</p>
    </div>
  );
};

export default CameraView;
