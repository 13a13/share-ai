
import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";

interface CameraViewProps {
  /**
   * Reference to the video element
   */
  videoRef: React.RefObject<HTMLVideoElement>;
  
  /**
   * Whether the camera is ready for use
   */
  isReady: boolean;
  
  /**
   * Whether the camera is in the processing state (initializing)
   */
  isProcessing: boolean;
  
  /**
   * Error message to display if there's an issue with the camera
   */
  errorMessage: string | null;
  
  /**
   * Current permission state for camera access
   */
  permissionState: 'prompt' | 'granted' | 'denied';
  
  /**
   * Function to start the camera
   */
  onStartCamera: () => void;
}

/**
 * Component that renders the actual camera view or appropriate placeholder
 */
const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  isReady,
  isProcessing,
  errorMessage,
  permissionState,
  onStartCamera
}) => {
  // Show video when camera is ready
  if (isReady) {
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
    );
  }

  // Show error message if there is one
  if (errorMessage) {
    return (
      <div className="text-white text-center p-4 flex flex-col items-center justify-center h-full">
        <p className="mb-4">{errorMessage}</p>
        <Button
          onClick={onStartCamera}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Show loading spinner while processing
  if (isProcessing) {
    return (
      <div className="text-white text-center p-4 flex flex-col items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-white" />
        <p>Accessing camera...</p>
      </div>
    );
  }

  // Show permission denied message
  if (permissionState === 'denied') {
    return (
      <div className="text-white text-center p-4 flex flex-col items-center justify-center h-full">
        <p className="mb-4">Camera access denied. Please enable camera permission in your browser settings.</p>
        <Button
          onClick={onStartCamera}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Show initial camera access button
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
