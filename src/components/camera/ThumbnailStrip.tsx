
import React, { useRef, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThumbnailStripProps {
  photos: string[];
  onDelete: (index: number) => void;
}

const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({ photos, onDelete }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Enhanced auto-scroll with smooth animation
  useEffect(() => {
    if (scrollRef.current && photos.length > 0) {
      const container = scrollRef.current;
      const scrollToEnd = () => {
        container.scrollTo({
          left: container.scrollWidth,
          behavior: 'smooth'
        });
      };
      
      // Slight delay to ensure thumbnail is rendered
      setTimeout(scrollToEnd, 100);
    }
  }, [photos.length]);
  
  if (photos.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-b from-black/60 to-transparent p-2">
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-2 py-1 scroll-smooth scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        aria-label="Captured photos"
      >
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden group border border-white/20 shadow-lg"
          >
            <img 
              src={photo} 
              alt={`Captured photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
            />
            
            {/* Enhanced overlay with photo number */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            
            {/* Photo number indicator */}
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
              {index + 1}
            </div>
            
            {/* Enhanced delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 w-6 h-6 p-1 bg-red-500/80 text-white opacity-70 hover:opacity-100 hover:bg-red-600 group-hover:opacity-100 transition-all duration-200"
              onClick={() => onDelete(index)}
              aria-label={`Delete photo ${index + 1}`}
            >
              <X className="h-3 w-3" />
            </Button>
            
            {/* Visual feedback for recent capture */}
            {index === photos.length - 1 && (
              <div className="absolute inset-0 border-2 border-green-400 animate-pulse" />
            )}
          </div>
        ))}
      </div>
      
      {/* Photo count indicator */}
      <div className="text-center mt-2">
        <span className="text-white/80 text-xs bg-black/40 px-2 py-1 rounded-full">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
        </span>
      </div>
    </div>
  );
};

export default ThumbnailStrip;
