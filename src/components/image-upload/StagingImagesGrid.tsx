
import { useDrag, useDrop } from 'react-dnd';
import { Button } from "@/components/ui/button";
import { Loader2, X, MoveVertical } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface StagingImageProps {
  image: string;
  index: number;
  isProcessing: boolean;
  onRemove: (index: number) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const StagingImage = ({ image, index, isProcessing, onRemove, onMove }: StagingImageProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'IMAGE',
    item: { index, id: `image-${index}`, type: 'IMAGE' } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isProcessing,
  });
  
  const [, drop] = useDrop({
    accept: 'IMAGE',
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      
      // Get horizontal middle
      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the left
      const hoverClientX = clientOffset!.x - hoverBoundingRect.left;
      
      // Only perform the move when the mouse has crossed half of the items height
      // Dragging left to right
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      
      // Dragging right to left
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }
      
      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // This generally isn't good practice, but it simplifies the example.
      // In real world applications this could potentially lead to weird state issues,
      // but in this specific case it should be fine.
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <div 
      ref={ref}
      className={`relative group aspect-square rounded-md overflow-hidden border ${isDragging ? 'opacity-50 border-dashed border-blue-500' : ''}`}
    >
      <img 
        src={image} 
        alt={`Uploaded preview ${index + 1}`} 
        className="w-full h-full object-cover"
      />
      {!isProcessing && (
        <>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(index)}
          >
            <X size={14} />
          </Button>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MoveVertical size={24} className="text-white drop-shadow-lg" />
          </div>
        </>
      )}
    </div>
  );
};

interface StagingImagesGridProps {
  stagingImages: string[];
  analysisInProgress: boolean;
  compressionInProgress: boolean;
  onCancel: () => void;
  onProcess: () => void;
  onRemoveStagingImage: (index: number) => void;
  onMoveImage: (dragIndex: number, hoverIndex: number) => void;
  totalImages: number;
  maxImages: number;
}

const StagingImagesGrid = ({
  stagingImages,
  analysisInProgress,
  compressionInProgress,
  onCancel,
  onProcess,
  onRemoveStagingImage,
  onMoveImage,
  totalImages,
  maxImages
}: StagingImagesGridProps) => {
  if (stagingImages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium flex justify-between">
        <span>New Images ({stagingImages.length})</span>
        <span className="text-gray-500">{totalImages}/{maxImages} total</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {stagingImages.map((image, index) => (
          <StagingImage
            key={index}
            image={image}
            index={index}
            isProcessing={analysisInProgress || compressionInProgress}
            onRemove={onRemoveStagingImage}
            onMove={onMoveImage}
          />
        ))}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={analysisInProgress || compressionInProgress}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={analysisInProgress || compressionInProgress}
          onClick={onProcess}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          {analysisInProgress ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Run AI Analysis"
          )}
        </Button>
      </div>
    </div>
  );
};

export default StagingImagesGrid;
