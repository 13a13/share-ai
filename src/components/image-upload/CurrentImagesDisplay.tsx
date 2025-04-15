
import { ScrollArea } from "../ui/scroll-area";
import ComponentImages from "../component/ComponentImages";
import { RoomComponentImage } from "@/types";

interface CurrentImagesDisplayProps {
  currentImages: RoomComponentImage[];
  onRemoveImage: (imageId: string) => void;
}

const CurrentImagesDisplay = ({ currentImages, onRemoveImage }: CurrentImagesDisplayProps) => {
  if (currentImages.length === 0) return null;
  
  return (
    <ScrollArea className="h-full max-h-[250px]">
      <div className="text-sm font-medium mb-2">
        Current Images ({currentImages.length})
      </div>
      <ComponentImages 
        images={currentImages}
        onRemoveImage={(imageId) => {
          // Find the index in the array by ID
          const index = currentImages.findIndex(img => img.id === imageId);
          if (index !== -1) {
            onRemoveImage(imageId);
          }
        }}
      />
    </ScrollArea>
  );
};

export default CurrentImagesDisplay;
