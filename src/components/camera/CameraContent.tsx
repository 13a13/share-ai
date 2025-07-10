
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
    <div className="relative flex flex-col h-full flex-1 min-h-0 w-full">
      <CameraViewport 
        videoRef={videoRef}
        facingMode={facingMode}
        isProcessing={isProcessing}
      />
      
      {/* Thumbnail strip */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <ThumbnailStrip 
          photos={capturedPhotos} 
          onDelete={onDeletePhoto} 
        />
      </div>
    </div>
  );
};

export default CameraContent;
