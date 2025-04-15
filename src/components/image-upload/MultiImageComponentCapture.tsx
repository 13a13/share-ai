
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useEffect, useState } from "react";
import { useImageUploadAndProcess } from "@/hooks/useImageUploadAndProcess";
import StagingImagesGrid from "./StagingImagesGrid";
import ProgressIndicator from "./ProgressIndicator";
import CurrentImagesDisplay from "./CurrentImagesDisplay";
import ImageUploadControls from "./ImageUploadControls";
import MaxImagesWarning from "./MaxImagesWarning";

interface MultiImageComponentCaptureProps {
  componentId: string;
  componentName: string;
  roomType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemoveImage: (imageId: string) => void; // Updated type
  disabled?: boolean;
}

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
  const [imageLoadProgress, setImageLoadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  
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
    currentImages,
    onImagesProcessed,
    onProcessingStateChange,
    processComponentImage: (imageUrls, roomType, componentName, multipleImages) => 
      import('@/services/imageProcessingService').then(module => 
        module.processComponentImage(imageUrls, roomType, componentName, multipleImages)
      )
  });

  // Simulate progress when loading images
  useEffect(() => {
    if (stagingImages.length > 0) {
      setShowProgress(true);
      setImageLoadProgress(0);
      
      const interval = setInterval(() => {
        setImageLoadProgress(prev => {
          const next = prev + Math.random() * 15;
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => setShowProgress(false), 500);
            return 100;
          }
          return next;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [stagingImages.length]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        {showProgress && stagingImages.length > 0 && (
          <ProgressIndicator progress={imageLoadProgress} />
        )}
      
        <StagingImagesGrid 
          stagingImages={stagingImages}
          analysisInProgress={analysisInProgress}
          compressionInProgress={compressionInProgress}
          onCancel={cancelStagingImages}
          onProcess={processImages}
          onRemoveStagingImage={handleRemoveStagingImage}
          onMoveImage={moveImage}
          totalImages={totalImages}
          maxImages={maxImages}
        />
        
        <CurrentImagesDisplay
          currentImages={currentImages}
          onRemoveImage={onRemoveImage} // Directly pass the prop
        />
        
        <ImageUploadControls
          componentId={componentId}
          isProcessing={isProcessing}
          compressionInProgress={compressionInProgress}
          handleImageCapture={handleImageCapture}
          handleCameraCapture={handleCameraCapture}
          canAddMore={canAddMore}
          disabled={disabled}
          totalImages={totalImages}
          maxImages={maxImages}
        />
        
        {!canAddMore && !stagingImages.length && (
          <MaxImagesWarning maxImages={maxImages} />
        )}
      </div>
    </DndProvider>
  );
};

export default MultiImageComponentCapture;
