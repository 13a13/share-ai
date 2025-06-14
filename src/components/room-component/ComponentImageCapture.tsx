
import { ConditionRating } from "@/types";
import MultiImageComponentCapture from "../image-upload/MultiImageComponentCapture";

interface ComponentImageCaptureProps {
  componentId: string;
  roomType: string;
  componentType: string;
  propertyName?: string;
  roomName?: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemovePreviewImage: (imageId: string) => void;
  disabled?: boolean;
}

/**
 * Wrapper component that uses MultiImageComponentCapture for component-level image capture
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
  onRemovePreviewImage,
  disabled
}: ComponentImageCaptureProps) => {
  console.log(`📷 ComponentImageCapture: propertyName="${propertyName}", roomName="${roomName}", componentType="${componentType}"`);
  
  return (
    <MultiImageComponentCapture
      componentId={componentId}
      componentName={componentType}
      roomType={roomType}
      propertyName={propertyName}
      roomName={roomName}
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
