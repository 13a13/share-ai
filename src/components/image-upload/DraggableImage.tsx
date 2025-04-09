
import { useDrag, useDrop } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// Define item type constant for drag and drop
export const IMAGE_ITEM_TYPE = "IMAGE";

// Define the type for drag item
export interface DragItem {
  index: number;
  type: string;
}

interface DraggableImageProps { 
  image: { url: string };
  index: number;
  onRemove: (index: number) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableImage = ({ 
  image, 
  index, 
  onRemove, 
  onMove 
}: DraggableImageProps) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: IMAGE_ITEM_TYPE,
    item: { index, type: IMAGE_ITEM_TYPE } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: IMAGE_ITEM_TYPE,
    hover: (item: DragItem, monitor) => {
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex; // Update the dragged item's index
    }
  });

  return (
    <div 
      ref={(node) => dragRef(dropRef(node))}
      className={cn(
        "relative group border rounded overflow-hidden cursor-move", 
        isDragging ? "opacity-50 border-dashed border-2 border-gray-400" : ""
      )}
    >
      <img 
        src={image.url} 
        alt={`Image ${index + 1}`} 
        className="w-full h-24 object-cover"
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <div className="absolute top-1 left-1 opacity-50 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
      </div>
    </div>
  );
};

export default DraggableImage;
