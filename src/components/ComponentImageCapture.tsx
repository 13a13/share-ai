
import { ConditionRating } from "@/types";
import ImageCapture, { ImageCaptureProps } from "@/components/common/ImageCapture";

type ComponentImageCaptureProps = Omit<ImageCaptureProps, 'componentName'> & {
  componentType: string;
  propertyName?: string;
  roomName?: string;
}

/**
 * Wrapper component that uses ImageCapture for component-level image capture
 * with compression functionality
 */
const ComponentImageCapture = ({
  componentId,
  componentType,
  roomType,
  propertyName,
  roomName,
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemoveImage,
  disabled
}: ComponentImageCaptureProps) => {
  console.log(`📷 ComponentImageCapture: propertyName="${propertyName}", roomName="${roomName}", componentType="${componentType}"`);
  
  return (
    <ImageCapture
      componentId={componentId}
      componentName={componentType}
      roomType={roomType}
      propertyName={propertyName}
      roomName={roomName}
      isProcessing={isProcessing}
      currentImages={currentImages}
      onImagesProcessed={onImagesProcessed}
      onProcessingStateChange={onProcessingStateChange}
      onRemoveImage={onRemoveImage}
      disabled={disabled}
    />
  );
};

export default ComponentImageCapture;
