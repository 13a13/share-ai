
import React from "react";
import { CircleX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CapturedPhotosGalleryProps {
  photos: string[];
  onRemovePhoto: (index: number) => void;
}

const CapturedPhotosGallery: React.FC<CapturedPhotosGalleryProps> = ({
  photos,
  onRemovePhoto,
}) => {
  if (photos.length === 0) return null;

  return (
    <ScrollArea className="bg-black/80 p-2 h-24 flex-shrink-0">
      <div className="flex gap-2 h-full">
        {photos.map((photo, index) => (
          <div key={index} className="relative h-20 w-20 flex-shrink-0">
            <img
              src={photo}
              alt={`Captured ${index + 1}`}
              className="h-full w-full object-cover rounded"
            />
            <button
              onClick={() => onRemovePhoto(index)}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"
            >
              <CircleX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default CapturedPhotosGallery;
