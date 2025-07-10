
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
    <footer className={`
      fixed bottom-0 left-0 w-full
      bg-black flex items-center justify-between
      px-6 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]
      sm:relative sm:bottom-auto sm:left-auto sm:w-auto sm:flex-shrink-0
      sm:bg-black sm:flex sm:items-center sm:justify-between
      sm:px-6 sm:pt-4 sm:pb-4
      md:relative md:bottom-auto md:left-auto md:w-auto md:flex-shrink-0
      md:bg-black md:flex md:items-center md:justify-between
      md:px-6 md:pt-4 md:pb-4
      lg:relative lg:bottom-auto lg:left-auto lg:w-auto lg:flex-shrink-0
      lg:bg-black lg:flex lg:items-center lg:justify-between
      lg:px-6 lg:pt-4 lg:pb-4
      xl:relative xl:bottom-auto xl:left-auto xl:w-auto xl:flex-shrink-0
      xl:bg-black xl:flex xl:items-center xl:justify-between
      xl:px-6 xl:pt-4 xl:pb-4
    `}>
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
