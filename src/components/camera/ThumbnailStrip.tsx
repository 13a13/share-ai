
import React, { useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThumbnailStripProps {
  /**
   * Array of captured photo data URLs
   */
  photos: string[];
  
  /**
   * Called when a photo is deleted
   */
  onDelete: (index: number) => void;
}

/**
 * A horizontally scrollable strip of thumbnails with delete buttons
 */
const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({ photos, onDelete }) => {
  // Reference to the scrollable container
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Scroll to the end when a new photo is added
  useEffect(() => {
    if (scrollRef.current && photos.length > 0) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [photos.length]);
  
  // Don't render if there are no photos
  if (photos.length === 0) {
    return null;
  }
  
  return (
    <div 
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-4 py-2 scroll-smooth scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      aria-label="Captured photos"
    >
      {photos.map((photo, index) => (
        <div 
          key={index} 
          className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden group"
        >
          <img 
            src={photo} 
            alt={`Captured photo ${index + 1}`}
            className="w-full h-full object-cover"
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 w-6 h-6 p-1 bg-black/60 text-white opacity-60 hover:opacity-100 group-hover:opacity-100"
            onClick={() => onDelete(index)}
            aria-label={`Delete photo ${index + 1}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ThumbnailStrip;
