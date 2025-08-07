
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
  const debug = typeof window !== 'undefined' && localStorage.getItem('debugImageFlow') === '1';
  if (debug) {
    console.log(`🔍 MultiImageComponentCapture props: propertyName="${propertyName}", roomName="${roomName}", componentName="${componentName}"`);
  }
  
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
    propertyName: propertyName || "unknown_property",
    roomName: roomName || "unknown_room",
    currentImages,
    onImagesProcessed,
    onProcessingStateChange,
    // Fix the function signature to match the expected interface
    processComponentImage: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => 
      processComponentImage(imageUrls, roomType, componentName, { multipleImages })
  });

  const isAnyProcessing = isProcessing || analysisInProgress || compressionInProgress;
  const showMaxWarning = totalImages >= maxImages;
  const hasStagingImages = stagingImages.length > 0;

  return (
    <div className="space-y-4">
      {/* Staging images grid */}
      {hasStagingImages && (
        <StagingImagesGrid
          images={stagingImages}
          onRemoveImage={handleRemoveStagingImage}
          onMoveImage={moveImage}
          onCancel={cancelStagingImages}
          onProcess={processImages}
          analysisInProgress={analysisInProgress}
          compressionInProgress={compressionInProgress}
          totalImages={totalImages}
          maxImages={maxImages}
        />
      )}

      {/* Progress indicator */}
      {(compressionInProgress || analysisInProgress) && (
        <ProgressIndicator
          value={compressionInProgress ? 50 : analysisInProgress ? 75 : 0}
          text={compressionInProgress ? "Compressing images..." : "Analyzing images..."}
          isLoading={true}
        />
      )}

      {/* Max images warning */}
      {showMaxWarning && (
        <MaxImagesWarning
          maxImages={maxImages}
        />
      )}

      {/* Upload controls - FIXED: Remove array wrapping since handleCameraCapture now handles normalization */}
      <ImageUploadControls
        componentId={componentId}
        canAddMore={canAddMore}
        isProcessing={isAnyProcessing}
        compressionInProgress={compressionInProgress}
        handleImageCapture={handleImageCapture}
        handleCameraCapture={handleCameraCapture} // No more array wrapping needed
        disabled={disabled || false}
        totalImages={totalImages}
        maxImages={maxImages}
      />
    </div>
  );
};

export default MultiImageComponentCapture;
