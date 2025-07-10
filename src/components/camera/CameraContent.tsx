
import React from "react";
import ThumbnailStrip from "./ThumbnailStrip";
import ErrorState from "./ErrorState";
import PermissionDeniedState from "./PermissionDeniedState";
import CameraViewport from "./CameraViewport";

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
    return <ErrorState errorMessage={errorMessage} onClose={onClose} />;
  }

  // Show permission denied state
  if (permissionState === 'denied') {
    return <PermissionDeniedState onClose={onClose} />;
  }

  // Show camera view with loading state
  return (
    <div className={`
      relative flex flex-col h-full flex-1
      sm:relative sm:flex sm:flex-col sm:h-full sm:flex-1 sm:min-h-0
      md:relative md:flex md:flex-col md:h-full md:flex-1 md:min-h-0
      lg:relative lg:flex lg:flex-col lg:h-full lg:flex-1 lg:min-h-0
      xl:relative xl:flex xl:flex-col xl:h-full xl:flex-1 xl:min-h-0
    `}>
      <CameraViewport 
        videoRef={videoRef}
        facingMode={facingMode}
        isProcessing={isProcessing}
      />
      
      {/* Thumbnail strip */}
      <div className={`
        absolute top-0 left-0 right-0 z-10
        sm:absolute sm:top-0 sm:left-0 sm:right-0 sm:z-10
        md:absolute md:top-0 md:left-0 md:right-0 md:z-10
        lg:absolute lg:top-0 lg:left-0 lg:right-0 lg:z-10
        xl:absolute xl:top-0 xl:left-0 xl:right-0 xl:z-10
      `}>
        <ThumbnailStrip 
          photos={capturedPhotos} 
          onDelete={onDeletePhoto} 
        />
      </div>
    </div>
  );
};

export default CameraContent;
