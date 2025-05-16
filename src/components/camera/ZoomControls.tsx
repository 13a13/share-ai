
import React from "react";

interface ZoomControlsProps {
  zoomLevels: number[];
  currentZoomIndex: number;
  onZoomChange: (index: number) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevels,
  currentZoomIndex,
  onZoomChange,
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full px-4 py-2 flex items-center gap-3">
      {zoomLevels.map((zoom, index) => (
        <button
          key={zoom}
          onClick={() => onZoomChange(index)}
          className={`text-white text-sm font-medium px-2 py-1 rounded ${
            currentZoomIndex === index
              ? "bg-white text-black"
              : "bg-transparent"
          }`}
        >
          {zoom}x
        </button>
      ))}
    </div>
  );
};

export default ZoomControls;
