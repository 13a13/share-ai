
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ConditionRating } from "@/types";
import ImageFileInput from "./ImageFileInput";
import { processComponentImage } from "@/services/imageProcessingService";
import StagingImagesGrid from "./image-upload/StagingImagesGrid";
import { useImageUploadAndProcess } from "@/hooks/useImageUploadAndProcess";

interface MultiImageComponentCaptureProps {
  componentId: string;
  componentName: string;
  roomType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemoveImage: (index: number) => void;
}

const MultiImageComponentCapture = ({ 
  componentId, 
  componentName,
  roomType, 
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemoveImage
}: MultiImageComponentCaptureProps) => {
  const {
    stagingImages,
    analysisInProgress,
    totalImages,
    canAddMore,
    handleImageCapture,
    handleCameraCapture,
    handleRemoveStagingImage,
    moveImage,
    processImages,
    cancelStagingImages
  } = useImageUploadAndProcess({
    componentId,
    componentName,
    roomType,
    currentImages,
    onImagesProcessed,
    onProcessingStateChange,
    processComponentImage
  });

  return (
    <div className="space-y-4">
      <StagingImagesGrid 
        stagingImages={stagingImages}
        analysisInProgress={analysisInProgress}
        onCancel={cancelStagingImages}
        onProcess={processImages}
        onRemoveStagingImage={handleRemoveStagingImage}
        onMoveImage={moveImage}
      />
      
      {canAddMore && (
        <div className="flex flex-wrap gap-2">
          <ImageFileInput
            id={`image-upload-${componentId}`}
            isProcessing={isProcessing}
            onChange={handleImageCapture}
            onImageCapture={handleCameraCapture}
            multiple={true} // Enable multiple file selection
          />
          <div className="text-sm text-gray-500 mt-1">
            {totalImages}/20 images
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiImageComponentCapture;
