
import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import ThumbnailStrip from "./ThumbnailStrip";
import { useToast } from "@/hooks/use-toast";

interface CameraContentProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isReady: boolean;
  isProcessing: boolean;
  errorMessage: string | null;
  permissionState: 'prompt' | 'granted' | 'denied';
  facingMode: 'user' | 'environment';
  capturedPhotos: string[];
  onClose: () => void;
  onDeletePhoto: (index: number) => void;
}

const CameraContent: React.FC<CameraContentProps> = ({
  videoRef,
  isReady,
  isProcessing,
  errorMessage,
  permissionState,
  facingMode,
  capturedPhotos,
  onClose,
  onDeletePhoto,
}) => {
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

  // Show camera view with loading state
  return (
    <div className="relative flex flex-col h-full">
      {/* Camera view */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {/* Video element */}
        <div 
          className={`absolute inset-0 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          style={{ 
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

        {/* Thumbnail strip */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <ThumbnailStrip 
            photos={capturedPhotos} 
            onDelete={onDeletePhoto} 
          />
        </div>
      </div>
    </div>
  );
};

export default CameraContent;
