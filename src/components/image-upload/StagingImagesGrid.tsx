
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ArrowUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface DraggableImageProps {
  src: string;
  index: number;
  onRemove: (index: number) => void;
  onMoveImage: (dragIndex: number, hoverIndex: number) => void;
}

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

// Draggable image component
const DraggableImage = ({ src, index, onRemove, onMoveImage }: DraggableImageProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'IMAGE',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'IMAGE',
    hover: (item: { index: number }, monitor) => {
      if (item.index !== index) {
        onMoveImage(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`relative group border rounded overflow-hidden aspect-square 
                ${isDragging ? 'opacity-50' : 'opacity-100'}
                ${isOver ? 'border-blue-500 border-2' : ''}`}
    >
      <img 
        src={src} 
        alt={`Preview ${index + 1}`} 
        className="w-full h-full object-cover"
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
        {index + 1}
      </div>
      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon"
          className="bg-black/50 hover:bg-black/70"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const StagingImagesGrid: React.FC<StagingImagesGridProps> = ({
  stagingImages,
  analysisInProgress,
  compressionInProgress,
  onCancel,
  onProcess,
  onRemoveStagingImage,
  onMoveImage,
  totalImages,
  maxImages
}) => {
  if (stagingImages.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">
          Preview Images ({stagingImages.length})
        </h3>
        <div className="text-xs text-gray-500">
          {totalImages}/{maxImages} total images
        </div>
      </div>
      
      <ScrollArea className="h-full max-h-[250px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {stagingImages.map((image, index) => (
            <DraggableImage
              key={index}
              src={image}
              index={index}
              onRemove={onRemoveStagingImage}
              onMoveImage={onMoveImage}
            />
          ))}
        </div>
      </ScrollArea>
      
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={analysisInProgress || compressionInProgress}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onProcess}
          disabled={analysisInProgress || compressionInProgress}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          {analysisInProgress || compressionInProgress ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {analysisInProgress ? "Analyzing..." : "Processing..."}
            </>
          ) : (
            "Analyze Images"
          )}
        </Button>
      </div>
    </Card>
  );
};

export default StagingImagesGrid;
