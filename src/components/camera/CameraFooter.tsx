
import React from "react";
import Shutter from "./Shutter";

interface CameraFooterProps {
  capturedPhotos: string[];
  maxPhotos: number;
  isReady: boolean;
  isCapturing: boolean;
  onCapture: () => void;
  onConfirm: () => void;
}

const CameraFooter: React.FC<CameraFooterProps> = ({
  capturedPhotos,
  maxPhotos,
  isReady,
  isCapturing,
  onCapture,
  onConfirm
}) => {
  return (
    <footer className="
      fixed bottom-0 left-0 w-full
      bg-black flex items-center justify-between
      px-6 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]
    ">
      <span className="text-white/80 text-sm">
        {capturedPhotos.length} / {maxPhotos} photos
      </span>
      
      <Shutter 
        onCapture={onCapture} 
        isCapturing={isCapturing}
        disabled={!isReady || capturedPhotos.length >= maxPhotos}
      />
      
      <button
        aria-label="Finish"
        onClick={onConfirm}
        disabled={!capturedPhotos.length}
        className="
          text-white text-base font-medium
          disabled:opacity-40 disabled:pointer-events-none
        "
      >
        Done
      </button>
    </footer>
  );
};

export default CameraFooter;
