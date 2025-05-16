
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShutterProps {
  /**
   * Whether the shutter button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the camera is currently capturing a photo
   */
  isCapturing?: boolean;
  
  /**
   * Callback when the shutter button is pressed
   */
  onCapture: () => void;
  
  /**
   * Size of the shutter button (in pixels)
   */
  size?: number;
}

/**
 * A circular shutter button for the camera
 */
const Shutter: React.FC<ShutterProps> = ({
  disabled = false,
  isCapturing = false,
  onCapture,
  size = 70
}) => {
  return (
    <button
      className={cn(
        "relative rounded-full flex items-center justify-center",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
      disabled={disabled || isCapturing}
      onClick={onCapture}
      aria-label="Take photo"
      style={{ 
        width: `${size}px`, 
        height: `${size}px` 
      }}
    >
      {/* Outer ring */}
      <div 
        className="absolute rounded-full border-2 border-white"
        style={{ 
          width: `${size}px`, 
          height: `${size}px` 
        }}
      />
      
      {/* Inner circle */}
      <div 
        className={cn(
          "rounded-full bg-white transition-all",
          isCapturing ? "scale-90" : ""
        )}
        style={{ 
          width: `${size * 0.8}px`, 
          height: `${size * 0.8}px` 
        }}
      />
      
      {/* Loading spinner */}
      {isCapturing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-black animate-spin" />
        </div>
      )}
    </button>
  );
};

export default Shutter;
