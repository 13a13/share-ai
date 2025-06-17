
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
    <div className="relative flex-1 bg-black overflow-hidden w-full h-full">
      {/* Video element */}
      <LoadingOverlay
        isLoading={isProcessing}
        loadingText="Accessing camera..."
        background="dark"
      >
        <div 
          className={`absolute inset-0 w-full h-full ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          style={{ 
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline 
            muted
            className="h-full w-full object-cover min-h-full min-w-full"
          />
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default CameraViewport;
