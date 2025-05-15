
import { ConditionRating } from "@/types";
import ImageCapture, { ImageCaptureProps } from "@/components/common/ImageCapture";

type ComponentImageCaptureProps = Omit<ImageCaptureProps, 'componentName'> & {
  componentType: string;
}

/**
 * Wrapper component that uses ImageCapture for component-level image capture
 * with compression functionality
 */
const ComponentImageCapture = ({
  componentId,
  componentType,
  roomType,
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemovePreviewImage,
  disabled
}: ComponentImageCaptureProps) => {
  return (
    <ImageCapture
      componentId={componentId}
      componentName={componentType}
      roomType={roomType}
      isProcessing={isProcessing}
      currentImages={currentImages}
      onImagesProcessed={onImagesProcessed}
      onProcessingStateChange={onProcessingStateChange}
      onRemoveImage={onRemovePreviewImage}
      disabled={disabled}
    />
  );
};

export default ComponentImageCapture;
