
import React from "react";
import { cn } from "@/lib/utils";

interface ZoomButtonsProps {
  /**
   * Array of available zoom levels (e.g., [0.5, 1, 2, 3])
   */
  zoomLevels: number[];
  
  /**
   * The index of the currently selected zoom level
   */
  currentIndex: number;
  
  /**
   * Callback when a zoom level is selected
   */
  onZoomChange: (index: number) => void;
}

/**
 * A pill-shaped component that displays available zoom options
 */
const ZoomButtons: React.FC<ZoomButtonsProps> = ({
  zoomLevels,
  currentIndex,
  onZoomChange
}) => {
  // Don't render if there's only one zoom level
  if (zoomLevels.length <= 1) {
    return null;
  }
  
  return (
    <div className="inline-flex rounded-full bg-black/60 p-1 backdrop-blur-sm">
      {zoomLevels.map((zoom, index) => (
        <button
          key={zoom}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            currentIndex === index
              ? "bg-white text-black"
              : "text-white hover:bg-white/20"
          )}
          onClick={() => onZoomChange(index)}
          aria-label={`${zoom}x zoom`}
          aria-pressed={currentIndex === index}
        >
          {zoom}×
        </button>
      ))}
    </div>
  );
};

export default ZoomButtons;
