
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ShutterProps {
  /**
   * Function called when the shutter button is pressed
   */
  onCapture: () => void;
  
  /**
   * Whether the camera is currently capturing a photo
   */
  isCapturing: boolean;
  
  /**
   * Whether the shutter button is disabled
   */
  disabled?: boolean;

  /**
   * Whether to display the shutter as an overlay
   */
  overlay?: boolean;
}

/**
 * A circular shutter button that shows a loading state when capturing
 */
const Shutter: React.FC<ShutterProps> = ({ 
  onCapture,
  isCapturing,
  disabled = false,
  overlay = false
}) => {
  return (
    <button
      className={`
        relative flex items-center justify-center w-20 h-20
        transition-opacity duration-150 hover:opacity-100 active:opacity-80
        ring-2 ring-white/60 focus:outline-none focus:ring-4 focus:ring-white
        ${overlay ? 'fixed bottom-28 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur p-1 rounded-full z-20' : ''}
      `}
      onClick={onCapture}
      disabled={disabled || isCapturing}
      aria-label="Take photo"
      tabIndex={0}
    >
      {isCapturing ? (
        // Show loading state
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Skeleton className="w-14 h-14 rounded-full" />
          </div>
        </div>
      ) : (
        // Show normal shutter button
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white" />
          {/* Inner circle */}
          <div className="absolute inset-2 rounded-full bg-white" />
        </div>
      )}
    </button>
  );
};

export default Shutter;
