
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { RoomComponentImage } from "@/types";

interface ComponentImagesProps {
  images: RoomComponentImage[];
  onRemoveImage: (imageId: string) => void;
}

const ComponentImages = ({ images, onRemoveImage }: ComponentImagesProps) => {
  if (images.length === 0) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
      {images.map((image) => (
        <div key={image.id} className="relative group border rounded overflow-hidden">
          <img 
            src={image.url} 
            alt="Component" 
            className="w-full h-32 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemoveImage(image.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ComponentImages;
