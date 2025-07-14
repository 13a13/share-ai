
import React from "react";
import Shutter from "./Shutter";
import { Badge } from "@/components/ui/badge";

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
  const photosRemaining = maxPhotos - capturedPhotos.length;
  const isAtLimit = capturedPhotos.length >= maxPhotos;
  
  return (
    <footer className="
      fixed bottom-0 left-0 w-full
      bg-black flex items-center justify-between
      px-6 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]
    ">
      {/* Enhanced photo counter with status indicator */}
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm">
            {capturedPhotos.length} / {maxPhotos} photos
          </span>
          {isAtLimit && (
            <Badge variant="secondary" className="text-xs">
              Max reached
            </Badge>
          )}
        </div>
        {!isAtLimit && photosRemaining <= 5 && (
          <span className="text-white/60 text-xs">
            {photosRemaining} remaining
          </span>
        )}
      </div>
      
      {/* Enhanced shutter with visual feedback */}
      <div className="flex flex-col items-center gap-2">
        <Shutter 
          onCapture={onCapture} 
          isCapturing={isCapturing}
          disabled={!isReady || isAtLimit}
          photosCount={capturedPhotos.length}
        />
        {isCapturing && (
          <span className="text-white/80 text-xs animate-pulse">
            Capturing...
          </span>
        )}
      </div>
      
      {/* Enhanced done button with better states */}
      <div className="flex flex-col items-end">
        <button
          aria-label="Finish capturing photos"
          onClick={onConfirm}
          disabled={!capturedPhotos.length}
          className="
            text-white text-base font-medium px-4 py-2 rounded-md
            transition-all duration-200
            disabled:opacity-40 disabled:pointer-events-none
            enabled:hover:bg-white/10 enabled:active:bg-white/20
          "
        >
          Done
        </button>
        {capturedPhotos.length > 0 && (
          <span className="text-white/60 text-xs mt-1">
            Tap to continue
          </span>
        )}
      </div>
    </footer>
  );
};

export default CameraFooter;
