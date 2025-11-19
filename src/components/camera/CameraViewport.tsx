
import React from "react";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

interface CameraViewportProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  facingMode: 'user' | 'environment';
  isProcessing: boolean;
}

const CameraViewport: React.FC<CameraViewportProps> = ({ 
  videoRef, 
  facingMode,
  isProcessing
}) => {
  return (
    <div className="relative flex-1 bg-black overflow-hidden w-full min-h-0">
      {/* Video element */}
      <LoadingOverlay
        isLoading={isProcessing}
        loadingText="Accessing camera..."
        background="dark"
      >
        <div 
          className="absolute inset-0 w-full h-full flex items-center justify-center"
          style={{ 
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline 
            muted
            className="w-full h-full object-contain"
          />
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default CameraViewport;
