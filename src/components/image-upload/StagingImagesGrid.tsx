
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Play } from "lucide-react";
import DraggableImage from './DraggableImage';

interface StagingImagesGridProps {
  images: string[];
  onRemoveImage: (index: number) => void;
  onMoveImage: (dragIndex: number, hoverIndex: number) => void;
  onCancel?: () => void;
  onProcess?: () => void;
  analysisInProgress?: boolean;
  compressionInProgress?: boolean;
  totalImages?: number;
  maxImages?: number;
}

const StagingImagesGrid = ({
  images = [], // Provide default empty array to prevent undefined errors
  onRemoveImage,
  onMoveImage,
  onCancel,
  onProcess,
  analysisInProgress = false,
  compressionInProgress = false,
  totalImages = 0,
  maxImages = 20
}: StagingImagesGridProps) => {
  // Only show drag hint if there's more than one image
  const showDragHint = React.useMemo(() => images && images.length > 1, [images]);
  
  // If no images, don't render anything
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">
            Pending Images ({images.length})
          </div>
          
          {showDragHint && (
            <div className="text-xs text-gray-500">
              Drag to reorder
            </div>
          )}
        </div>
        
        <ScrollArea className="h-full max-h-[250px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((url, index) => (
              <DraggableImage
                key={index}
                index={index}
                image={{ url }}
                onRemove={() => onRemoveImage(index)}
                onMove={onMoveImage}
              />
            ))}
          </div>
        </ScrollArea>
        
        {(onCancel || onProcess) && (
          <div className="flex justify-end items-center gap-2">
            <span className="text-xs text-gray-500 mr-auto">
              {totalImages}/{maxImages} images
            </span>
            
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={analysisInProgress || compressionInProgress}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            
            {onProcess && (
              <Button
                variant="default"
                size="sm"
                onClick={onProcess}
                disabled={analysisInProgress || compressionInProgress || images.length === 0}
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
            )}
          </div>
        )}
        
        {analysisInProgress && (
          <div className="p-3 border border-shareai-teal/30 rounded bg-shareai-teal/5">
            <p className="text-sm text-shareai-teal flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI is analyzing {images.length} {images.length === 1 ? 'image' : 'images'}...
            </p>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default StagingImagesGrid;
