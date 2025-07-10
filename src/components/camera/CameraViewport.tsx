
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
    <div className={`
      relative flex-1 bg-black overflow-hidden w-full h-full
      sm:relative sm:flex-1 sm:bg-black sm:overflow-hidden sm:w-full sm:h-full sm:min-h-screen
      md:relative md:flex-1 md:bg-black md:overflow-hidden md:w-full md:h-full md:min-h-screen
      lg:relative lg:flex-1 lg:bg-black lg:overflow-hidden lg:w-full lg:h-full lg:min-h-screen
      xl:relative xl:flex-1 xl:bg-black xl:overflow-hidden xl:w-full xl:h-full xl:min-h-screen
    `}>
      {/* Video element */}
      <LoadingOverlay
        isLoading={isProcessing}
        loadingText="Accessing camera..."
        background="dark"
      >
        <div 
          className={`
            absolute inset-0 w-full h-full
            sm:absolute sm:inset-0 sm:w-full sm:h-full
            md:absolute md:inset-0 md:w-full md:h-full
            lg:absolute lg:inset-0 lg:w-full lg:h-full
            xl:absolute xl:inset-0 xl:w-full xl:h-full
            ${facingMode === 'user' ? 'scale-x-[-1]' : ''}
          `}
          style={{ 
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline 
            muted
            className={`
              h-full w-full object-cover min-h-full min-w-full
              sm:h-full sm:w-full sm:object-cover sm:min-h-full sm:min-w-full
              md:h-full md:w-full md:object-cover md:min-h-full md:min-w-full
              lg:h-full lg:w-full lg:object-cover lg:min-h-full lg:min-w-full
              xl:h-full xl:w-full xl:object-cover xl:min-h-full xl:min-w-full
            `}
          />
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default CameraViewport;
