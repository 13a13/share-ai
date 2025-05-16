
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import ZoomControls from "./ZoomControls";

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
  if (errorMessage) {
    return (
      <div className="text-white text-center p-4">
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
          className="max-h-full max-w-full object-cover transform"
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
      <div className="text-white text-center p-4">
        <div className="h-10 w-10 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto mb-4"></div>
        <p>Accessing camera...</p>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className="text-white text-center p-4">
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
    <div className="text-white text-center p-4">
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
