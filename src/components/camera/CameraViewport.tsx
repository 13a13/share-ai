
import React from "react";

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
    </div>
  );
};

export default CameraViewport;
