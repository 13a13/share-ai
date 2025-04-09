
import { ConditionRating } from "@/types";
import MultiImageComponentCapture from "../MultiImageComponentCapture";

interface ComponentImageCaptureProps {
  componentId: string;
  roomType: string;
  componentType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemovePreviewImage: (index: number) => void;
}

/**
 * Wrapper component that uses MultiImageComponentCapture for component-level image capture
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
  onRemovePreviewImage
}: ComponentImageCaptureProps) => {
  return (
    <MultiImageComponentCapture
      componentId={componentId}
      componentName={componentType}
      roomType={roomType}
      isProcessing={isProcessing}
      currentImages={currentImages}
      onImagesProcessed={onImagesProcessed}
      onProcessingStateChange={onProcessingStateChange}
      onRemoveImage={onRemovePreviewImage}
    />
  );
};

export default ComponentImageCapture;
