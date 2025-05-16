
import React from "react";
import { Button } from "@/components/ui/button";

interface CameraControlsProps {
  isCameraActive: boolean;
  isProcessing: boolean;
  hasMultipleCameras: boolean;
  capturedPhotos: string[];
  maxPhotos: number;
  onTakePhoto: () => void;
  onSwitchCamera: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  isCameraActive,
  isProcessing,
  hasMultipleCameras,
  capturedPhotos,
  maxPhotos,
  onTakePhoto,
  onSwitchCamera,
}) => {
  if (!isCameraActive) return null;

  return (
    <div className="p-4 bg-black">
      <div className="flex items-center justify-between">
        {/* Camera switch button (only show if multiple cameras detected) */}
        <div className="w-12">
          {hasMultipleCameras && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSwitchCamera}
              className="text-white hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 7h.01"></path>
                <rect width="18" height="14" x="3" y="3" rx="2"></rect>
                <path d="m9 11 3-3 3 3"></path>
                <path d="M12 14v-6"></path>
              </svg>
            </Button>
          )}
        </div>
        
        {/* Shutter button */}
        <Button
          onClick={onTakePhoto}
          disabled={isProcessing || capturedPhotos.length >= maxPhotos}
          size="icon"
          className={`rounded-full w-16 h-16 ${
            isProcessing
              ? "bg-gray-600"
              : "bg-white hover:bg-gray-200"
          }`}
        >
          {isProcessing ? (
            <div className="h-14 w-14 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
          ) : (
            <div className="h-14 w-14 rounded-full border-4 border-gray-900"></div>
          )}
        </Button>
        
        {/* Empty space to balance layout */}
        <div className="w-12"></div>
      </div>
      
      {/* Photos counter */}
      <div className="text-white text-center mt-4 text-sm">
        {capturedPhotos.length}/{maxPhotos} photos
      </div>
    </div>
  );
};

export default CameraControls;
