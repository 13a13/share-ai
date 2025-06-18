
import { ConditionRating } from "@/types";
import ImageCapture from "./common/ImageCapture";
import { processComponentImage } from "@/services/imageProcessingService";

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

/**
 * Wrapper component that uses unified ImageCapture
 * This maintains backward compatibility with existing code
 */
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
  disabled = false
}: MultiImageComponentCaptureProps) => {
  console.log(`🖼️ MultiImageComponentCapture: propertyName="${propertyName}", roomName="${roomName}", componentName="${componentName}"`);
  
  return (
    <ImageCapture
      componentId={componentId}
      componentName={componentName}
      roomType={roomType}
      propertyName={propertyName}
      roomName={roomName}
      isProcessing={isProcessing}
      currentImages={currentImages}
      onImagesProcessed={onImagesProcessed}
      onProcessingStateChange={onProcessingStateChange}
      onRemoveImage={onRemoveImage}
      disabled={disabled}
      // Enhanced processing function with context - fix the type signature
      processComponentImage={(imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => 
        processComponentImage(imageUrls, roomType, componentName, { 
          multipleImages,
          propertyName: propertyName || "unknown_property",
          roomName: roomName || "unknown_room"
        })
      }
      // Enable multiple capture for this component
      supportMultipleCapture={true}
    />
  );
};

export default MultiImageComponentCapture;
