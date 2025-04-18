
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ConditionRating } from "@/types";
import ImageFileInput from "./ImageFileInput";
import { processComponentImage } from "@/services/imageProcessingService";
import StagingImagesGrid from "./image-upload/StagingImagesGrid";
import { useImageUploadAndProcess } from "@/hooks/useImageUploadAndProcess";
import ComponentImages from "./component/ComponentImages";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { useEffect, useState } from "react";

interface MultiImageComponentCaptureProps {
  componentId: string;
  componentName: string;
  roomType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemoveImage: (imageId: string) => void; // Changed from (index: number) to (imageId: string)
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
    processComponentImage
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
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Preparing images...</span>
              <span>{Math.round(imageLoadProgress)}%</span>
            </div>
            <Progress value={imageLoadProgress} className="h-1" />
          </div>
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
        
        {currentImages.length > 0 && (
          <ScrollArea className="h-full max-h-[250px]">
            <div className="text-sm font-medium mb-2">
              Current Images ({currentImages.length})
            </div>
            <ComponentImages 
              images={currentImages}
              onRemoveImage={onRemoveImage} // Directly pass the onRemoveImage function
            />
          </ScrollArea>
        )}
        
        <div className="flex flex-col gap-2">
          <ImageFileInput
            id={`image-upload-${componentId}`}
            isProcessing={isProcessing || compressionInProgress}
            onChange={handleImageCapture}
            onImageCapture={handleCameraCapture}
            multiple={true}
            disabled={!canAddMore || disabled}
            totalImages={totalImages}
            maxImages={maxImages}
            compressionInProgress={compressionInProgress}
          />
          <div className="text-sm text-gray-500 mt-1">
            {totalImages}/{maxImages} images
          </div>
        </div>
        
        {!canAddMore && !stagingImages.length && (
          <Card className="p-3 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-700">
              Maximum number of images reached ({maxImages}). Remove some images to add more.
            </p>
          </Card>
        )}
      </div>
    </DndProvider>
  );
};

export default MultiImageComponentCapture;
