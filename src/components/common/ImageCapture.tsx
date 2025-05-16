
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useEffect, useState } from "react";
import { useImageUploadAndProcess } from "@/hooks/useImageUploadAndProcess";
import StagingImagesGrid from "../image-upload/StagingImagesGrid";
import { ProgressIndicator } from "../ui/progress-indicator";
import WhatsAppStyleImageUploadControls from "../image-upload/WhatsAppStyleImageUploadControls";
import MaxImagesWarning from "../image-upload/MaxImagesWarning";
import { ScrollArea } from "../ui/scroll-area";
import ComponentImages from "../component/ComponentImages";

export interface ImageCaptureProps {
  componentId: string;
  componentName: string;
  roomType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemoveImage: (imageId: string) => void;
  disabled?: boolean;
  showCurrentImages?: boolean;
  processComponentImage?: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<any>;
}

/**
 * Unified ImageCapture component that handles image upload, processing, and display
 * for both room components and general usage
 */
const ImageCapture = ({
  componentId, 
  componentName,
  roomType, 
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemoveImage,
  disabled = false,
  showCurrentImages = true,
  processComponentImage
}: ImageCaptureProps) => {
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
    processComponentImage: processComponentImage || 
      ((imageUrls, roomType, componentName, multipleImages) => 
        import('@/services/imageProcessingService').then(module => 
          module.processComponentImage(imageUrls, roomType, componentName, multipleImages)
        )
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
          <ProgressIndicator
            value={imageLoadProgress}
            text="Preparing images..."
            showPercentage
          />
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
        
        {showCurrentImages && currentImages.length > 0 && (
          <ScrollArea className="h-full max-h-[250px]">
            <div className="text-sm font-medium mb-2">
              Current Images ({currentImages.length})
            </div>
            <ComponentImages 
              images={currentImages}
              onRemoveImage={onRemoveImage}
            />
          </ScrollArea>
        )}
        
        <WhatsAppStyleImageUploadControls
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

export default ImageCapture;
