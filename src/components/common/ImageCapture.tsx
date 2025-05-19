
import { useState, useRef } from "react";
import { ConditionRating } from "@/types";
import { useImageUploadAndProcess } from "@/hooks/useImageUploadAndProcess";
import WhatsAppStyleImageInput from "../camera/WhatsAppStyleImageInput";
import { Button } from "../ui/button";
import { X, ImageIcon, AlertTriangle } from "lucide-react";
import StagingImagesGrid from "../image-upload/StagingImagesGrid";
import MaxImagesWarning from "../image-upload/MaxImagesWarning";

export interface ImageCaptureProps {
  componentId: string;
  componentName: string;
  roomType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemoveImage: (imageId: string) => void; 
  processComponentImage?: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<any>;
  disabled?: boolean;
}

const ImageCapture = ({
  componentId,
  componentName,
  roomType,
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemoveImage,
  processComponentImage,
  disabled = false
}: ImageCaptureProps) => {
  // Lazy load imageProcessingService if not provided
  const processImage = async (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => {
    if (processComponentImage) {
      return processComponentImage(imageUrls, roomType, componentName, multipleImages);
    } else {
      // Dynamically import the service
      const module = await import('@/services/imageProcessingService');
      return module.processComponentImage(
        imageUrls, 
        roomType, 
        componentName, 
        { 
          multipleImages,
          // Enable advanced analysis when processing multiple images
          useAdvancedAnalysis: imageUrls.length > 1
        }
      );
    }
  };
  
  // Use the image upload and process hook
  const {
    stagingImages,
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
    processComponentImage: processImage
  });
  
  // Check if we have reached maximum images
  const hasReachedMaximum = currentImages.length >= maxImages;
  
  return (
    <div className="space-y-4">
      {hasReachedMaximum ? (
        <MaxImagesWarning maxImages={maxImages} />
      ) : stagingImages.length > 0 ? (
        <div className="space-y-4">
          <StagingImagesGrid 
            images={stagingImages}
            onRemoveImage={handleRemoveStagingImage}
            onMoveImage={moveImage}
          />
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline" 
              onClick={cancelStagingImages}
              className="gap-1"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            
            <Button 
              onClick={processImages}
              disabled={isProcessing || stagingImages.length === 0}
              className={`gap-1 ${stagingImages.length > 1 ? "bg-blue-600 hover:bg-blue-700" : "bg-shareai-teal hover:bg-shareai-teal/90"}`}
            >
              {stagingImages.length > 1 ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Analyze {stagingImages.length} Images
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  Process Image
                </>
              )}
            </Button>
            
            {stagingImages.length > 1 && (
              <div className="w-full mt-1 text-xs text-blue-700 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Advanced multi-image analysis will be used for better accuracy</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <WhatsAppStyleImageInput
          id={`image-upload-${componentId}`}
          isProcessing={isProcessing}
          onChange={handleImageCapture}
          onImageCapture={handleCameraCapture}
          disabled={disabled || isProcessing || hasReachedMaximum}
          totalImages={totalImages}
          maxImages={maxImages}
          compressionInProgress={compressionInProgress}
        />
      )}
    </div>
  );
};

export default ImageCapture;
