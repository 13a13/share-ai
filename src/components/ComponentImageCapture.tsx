
import { ConditionRating } from "@/types";
import ImageCapture, { ImageCaptureProps } from "@/components/common/ImageCapture";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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
  onRemoveImage,
  disabled,
  processComponentImage
}: ComponentImageCaptureProps) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ImageCapture
        componentId={componentId}
        componentName={componentType}
        roomType={roomType}
        isProcessing={isProcessing}
        currentImages={currentImages}
        onImagesProcessed={onImagesProcessed}
        onProcessingStateChange={onProcessingStateChange}
        onRemoveImage={onRemoveImage}
        disabled={disabled}
        processComponentImage={processComponentImage}
      />
    </DndProvider>
  );
};

export default ComponentImageCapture;
