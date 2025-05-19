
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ImageCapture from "../common/ImageCapture";

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
 * Wrapper component that uses the unified ImageCapture component
 * Provided for backward compatibility with existing code
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
      processComponentImage={(imageUrls, roomType, componentName, options) => 
        import('@/services/imageProcessingService').then(module => 
          module.processComponentImage(imageUrls, roomType, componentName, 
            typeof options === 'boolean' ? { multipleImages: options } : options)
        )
      }
    />
  );
};

export default MultiImageComponentCapture;
