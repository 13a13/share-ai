
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { RoomComponentImage } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface ComponentImagesProps {
  images: RoomComponentImage[];
  onRemoveImage: (imageId: string) => void;
  maxHeight?: string;
  showTimestamps?: boolean;
}

const ComponentImages = ({ 
  images, 
  onRemoveImage, 
  maxHeight = "350px",
  showTimestamps = false
}: ComponentImagesProps) => {
  if (images.length === 0) return null;
  
  return (
    <ScrollArea className={`max-h-[${maxHeight}]`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-2">
        {images.map((image) => (
          <div key={image.id} className="relative group border rounded overflow-hidden aspect-square">
            <img 
              src={image.url} 
              alt="Component" 
              className="w-full h-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemoveImage(image.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            {showTimestamps && image.timestamp && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-1 text-xs">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(image.timestamp), 'dd MMM yyyy HH:mm')}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ComponentImages;
