
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Play } from "lucide-react";
import DraggableImage from './DraggableImage';

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
  const showDragHint = React.useMemo(() => stagingImages.length > 1, [stagingImages.length]);
  
  if (stagingImages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">
          Pending Images ({stagingImages.length})
        </div>
        
        {showDragHint && (
          <div className="text-xs text-gray-500">
            Drag to reorder
          </div>
        )}
      </div>
      
      <ScrollArea className="h-full max-h-[250px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {stagingImages.map((url, index) => (
            <DraggableImage
              key={index}
              index={index}
              image={{ url }}
              onRemove={() => onRemoveStagingImage(index)}
              onMove={onMoveImage}
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
          disabled={analysisInProgress || compressionInProgress || stagingImages.length === 0}
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
            AI is analyzing {stagingImages.length} {stagingImages.length === 1 ? 'image' : 'images'}...
          </p>
        </Card>
      )}
    </div>
  );
};

export default StagingImagesGrid;
