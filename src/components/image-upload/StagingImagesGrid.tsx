
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggableImage from "./DraggableImage";

interface StagingImagesGridProps {
  stagingImages: string[];
  analysisInProgress: boolean;
  onCancel: () => void;
  onProcess: () => void;
  onRemoveStagingImage: (index: number) => void;
  onMoveImage: (dragIndex: number, hoverIndex: number) => void;
}

const StagingImagesGrid = ({
  stagingImages,
  analysisInProgress,
  onCancel,
  onProcess,
  onRemoveStagingImage,
  onMoveImage
}: StagingImagesGridProps) => {
  if (stagingImages.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Preview Images ({stagingImages.length})</div>
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {stagingImages.map((image, index) => (
            <DraggableImage
              key={index}
              image={{ url: image }}
              index={index}
              onRemove={onRemoveStagingImage}
              onMove={onMoveImage}
            />
          ))}
        </div>
      </DndProvider>
      <div className="flex justify-end space-x-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancel}
          disabled={analysisInProgress}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onProcess}
          disabled={analysisInProgress || stagingImages.length === 0}
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
