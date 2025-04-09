
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggableImage from "./DraggableImage";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">
          {compressionInProgress ? (
            <span className="flex items-center text-shareai-teal">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 
              Compressing images...
            </span>
          ) : (
            `Preview Images (${stagingImages.length})`
          )}
        </div>
        <div className="text-xs text-gray-500">{totalImages} of {maxImages} total</div>
      </div>
      
      <ScrollArea className="h-full max-h-[250px]">
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {stagingImages.map((image, index) => (
              <DraggableImage
                key={`staging-${index}`}
                image={{ url: image }}
                index={index}
                onRemove={onRemoveStagingImage}
                onMove={onMoveImage}
                badgeNumber={index + 1}
              />
            ))}
          </div>
        </DndProvider>
      </ScrollArea>
      
      <div className="flex justify-end space-x-2">
        <Button
          variant="destructive"
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
          disabled={analysisInProgress || compressionInProgress || stagingImages.length === 0}
        >
          {analysisInProgress ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Analyze Images"
          )}
        </Button>
      </div>
    </div>
  );
};

export default StagingImagesGrid;
