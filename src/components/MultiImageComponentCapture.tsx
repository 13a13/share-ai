
import { ConditionRating } from "@/types";
import ImageCapture from "./common/ImageCapture";
import { processComponentImage } from "@/services/imageProcessingService";

interface MultiImageComponentCaptureProps {
  componentId: string;
  componentName: string;
  roomType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemoveImage: (imageId: string) => void; 
  disabled?: boolean;
}

/**
 * Wrapper component that uses unified ImageCapture
 * This maintains backward compatibility with existing code
 */
const MultiImageComponentCapture = ({ 
  componentId, 
  componentName,
  roomType, 
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemoveImage,
  disabled = false
}: MultiImageComponentCaptureProps) => {
  return (
    <ImageCapture
      componentId={componentId}
      componentName={componentName}
      roomType={roomType}
      isProcessing={isProcessing}
      currentImages={currentImages}
      onImagesProcessed={onImagesProcessed}
      onProcessingStateChange={onProcessingStateChange}
      onRemoveImage={onRemoveImage}
      disabled={disabled}
      // Fix for type error: Convert function signature to match expected type
      processComponentImage={(imageUrls, roomType, componentName, multipleImages) => 
        processComponentImage(imageUrls, roomType, componentName, { multipleImages })
      }
    />
  );
};

export default MultiImageComponentCapture;
