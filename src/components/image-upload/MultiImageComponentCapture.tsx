
import { useImageUploadAndProcess } from "@/hooks/useImageUploadAndProcess";
import { processComponentImage } from "@/services/imageProcessingService";
import StagingImagesGrid from "./StagingImagesGrid";
import ImageUploadControls from "./ImageUploadControls";
import MaxImagesWarning from "./MaxImagesWarning";
import ProgressIndicator from "./ProgressIndicator";

interface MultiImageComponentCaptureProps {
  componentId: string;
  componentName: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemoveImage: (imageId: string) => void;
  disabled?: boolean;
}

const MultiImageComponentCapture = ({
  componentId,
  componentName,
  roomType,
  propertyName,
  roomName,
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemoveImage,
  disabled
}: MultiImageComponentCaptureProps) => {
  
  const {
    stagingImages,
    analysisInProgress,
    compressionInProgress,
    totalImages,
    maxImages,
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
    propertyName,
    roomName,
    currentImages,
    onImagesProcessed,
    onProcessingStateChange,
    processComponentImage
  });

  const isAnyProcessing = isProcessing || analysisInProgress || compressionInProgress;
  const showMaxWarning = totalImages >= maxImages;
  const hasStagingImages = stagingImages.length > 0;

  return (
    <div className="space-y-4">
      {/* Staging images grid */}
      {hasStagingImages && (
        <StagingImagesGrid
          stagingImages={stagingImages}
          onRemoveImage={handleRemoveStagingImage}
          onMoveImage={moveImage}
          isProcessing={isAnyProcessing}
        />
      )}

      {/* Progress indicator */}
      {(compressionInProgress || analysisInProgress) && (
        <ProgressIndicator
          compressionInProgress={compressionInProgress}
          analysisInProgress={analysisInProgress}
          stagingImagesCount={stagingImages.length}
        />
      )}

      {/* Max images warning */}
      {showMaxWarning && (
        <MaxImagesWarning
          currentCount={totalImages}
          maxCount={maxImages}
        />
      )}

      {/* Upload controls */}
      <ImageUploadControls
        canAddMore={canAddMore}
        hasStagingImages={hasStagingImages}
        isProcessing={isAnyProcessing}
        disabled={disabled}
        onImageCapture={handleImageCapture}
        onCameraCapture={handleCameraCapture}
        onProcessImages={processImages}
        onCancelStaging={cancelStagingImages}
      />
    </div>
  );
};

export default MultiImageComponentCapture;
