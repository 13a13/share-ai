
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Play } from "lucide-react";
import DraggableImage from './DraggableImage';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface StagingImagesGridProps {
  stagingImages?: string[];
  images?: string[];
  analysisInProgress?: boolean;
  compressionInProgress?: boolean;
  onCancel?: () => void;
  onProcess?: () => void;
  onRemoveStagingImage?: (index: number) => void;
  onRemoveImage?: (index: number) => void;
  onMoveImage?: (dragIndex: number, hoverIndex: number) => void;
  totalImages?: number;
  maxImages?: number;
}

const StagingImagesGrid = ({
  stagingImages = [],
  images = [],
  analysisInProgress = false,
  compressionInProgress = false,
  onCancel = () => {},
  onProcess = () => {},
  onRemoveStagingImage,
  onRemoveImage,
  onMoveImage,
  totalImages = 0,
  maxImages = 20
}: StagingImagesGridProps) => {
  // Use stagingImages as the primary source, fall back to images prop for backward compatibility
  const displayImages = stagingImages.length > 0 ? stagingImages : images;
  const handleRemoveImage = onRemoveStagingImage || onRemoveImage || (() => {});
  
  const showDragHint = React.useMemo(() => displayImages.length > 1, [displayImages.length]);
  
  if (displayImages.length === 0) {
    return null;
  }

  // Function to safely handle drag and drop operations
  const handleMoveImage = (dragIndex: number, hoverIndex: number) => {
    if (onMoveImage && typeof onMoveImage === 'function') {
      onMoveImage(dragIndex, hoverIndex);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">
          Pending Images ({displayImages.length})
        </div>
        
        {showDragHint && (
          <div className="text-xs text-gray-500">
            Drag to reorder
          </div>
        )}
      </div>
      
      <ScrollArea className="h-full max-h-[250px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {displayImages.map((url, index) => (
            <DraggableImage
              key={index}
              index={index}
              image={{ url }}
              onRemove={() => handleRemoveImage(index)}
              onMove={handleMoveImage}
            />
          ))}
        </div>
      </ScrollArea>
      
      <div className="flex justify-end items-center gap-2">
        <span className="text-xs text-gray-500 mr-auto">
          {totalImages}/{maxImages} images
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={analysisInProgress || compressionInProgress}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={onProcess}
          disabled={analysisInProgress || compressionInProgress || displayImages.length === 0}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          {analysisInProgress ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : compressionInProgress ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Compressing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Analyze Images
            </>
          )}
        </Button>
      </div>
      
      {analysisInProgress && (
        <Card className="p-3 border-shareai-teal bg-shareai-teal/5">
          <p className="text-sm text-shareai-teal flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            AI is analyzing {displayImages.length} {displayImages.length === 1 ? 'image' : 'images'}...
          </p>
        </Card>
      )}
    </div>
  );
};

export default StagingImagesGrid;
