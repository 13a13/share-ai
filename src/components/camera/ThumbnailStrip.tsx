
import React, { useRef } from "react";
import { X } from "lucide-react";

interface ThumbnailStripProps {
  /**
   * Array of captured photo data URLs to display
   */
  photos: string[];
  
  /**
   * Callback when a photo is removed
   */
  onRemovePhoto: (index: number) => void;
}

/**
 * A horizontal scrollable strip showing captured photo thumbnails
 */
const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({ 
  photos,
  onRemovePhoto
}) => {
  const stripRef = useRef<HTMLDivElement>(null);
  
  // Scroll to the end when a new photo is added
  React.useEffect(() => {
    if (stripRef.current && photos.length > 0) {
      stripRef.current.scrollLeft = stripRef.current.scrollWidth;
    }
  }, [photos.length]);
  
  if (photos.length === 0) {
    return null;
  }
  
  return (
    <div 
      ref={stripRef}
      className="w-full overflow-x-auto pb-2 px-4 scrollbar-hide"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="flex gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative flex-shrink-0">
            <div className="h-16 w-16 rounded-md overflow-hidden border border-white/30">
              <img 
                src={photo} 
                alt={`Captured photo ${index + 1}`} 
                className="h-full w-full object-cover"
              />
            </div>
            <button
              className="absolute -top-1 -right-1 bg-black/70 rounded-full p-1"
              onClick={() => onRemovePhoto(index)}
              aria-label={`Remove photo ${index + 1}`}
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThumbnailStrip;
