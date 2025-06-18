
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ShutterProps {
  onCapture: () => void;
  isCapturing: boolean;
  disabled?: boolean;
  photosCount?: number;
}

const Shutter: React.FC<ShutterProps> = ({ 
  onCapture,
  isCapturing,
  disabled = false,
  photosCount = 0
}) => {
  // Calculate ring progress based on photos taken
  const progressRing = photosCount > 0 ? (photosCount / 20) * 100 : 0;
  
  return (
    <div className="relative">
      {/* Progress ring for multiple photos */}
      {photosCount > 0 && (
        <div className="absolute -inset-2">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="3"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="#10b981"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressRing / 100)}`}
              className="transition-all duration-300"
            />
          </svg>
        </div>
      )}
      
      <button
        className={`
          relative flex items-center justify-center w-16 h-16
          transition-all duration-200
          ring-2 ring-white/60 focus:outline-none focus:ring-4 focus:ring-white
          shadow-md rounded-full
          ${disabled ? 'opacity-50' : 'hover:scale-105 active:scale-95'}
          ${isCapturing ? 'animate-pulse' : ''}
        `}
        onClick={onCapture}
        disabled={disabled || isCapturing}
        aria-label={photosCount > 0 ? `Take photo ${photosCount + 1}` : "Take photo"}
        tabIndex={0}
      >
        {isCapturing ? (
          // Enhanced loading state
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          </div>
        ) : (
          // Enhanced normal state with visual feedback
          <div className="relative w-16 h-16">
            {/* Outer ring */}
            <div className={`
              absolute inset-0 rounded-full border-2 
              ${disabled ? 'border-white/30' : 'border-white'}
              transition-colors duration-200
            `} />
            
            {/* Inner circle with subtle animation */}
            <div className={`
              absolute inset-2 rounded-full 
              ${disabled ? 'bg-white/30' : 'bg-white'}
              transition-all duration-200
              ${!disabled && !isCapturing ? 'hover:bg-gray-100' : ''}
            `} />
            
            {/* Photo count indicator */}
            {photosCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {photosCount}
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  );
};

export default Shutter;
