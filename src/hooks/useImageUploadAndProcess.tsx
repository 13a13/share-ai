
import { useState } from "react";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { useStagingImages } from "./useStagingImages";
import { useImageAnalysis } from "./useImageAnalysis";

interface UseImageUploadAndProcessProps {
  componentId: string;
  componentName: string;
  roomType: string;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, options: boolean | { multipleImages?: boolean; useAdvancedAnalysis?: boolean }) => Promise<ProcessedImageResult>;
}

export function useImageUploadAndProcess({
  componentId,
  componentName,
  roomType,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  processComponentImage
}: UseImageUploadAndProcessProps) {
  const MAX_IMAGES = 20;

  // Use the staging images hook
  const {
    stagingImages,
    compressionInProgress,
    totalImages,
    canAddMore,
    handleImageCapture,
    handleCameraCapture,
    handleRemoveStagingImage,
    moveImage,
    clearStagingImages
  } = useStagingImages({
    maxImages: MAX_IMAGES,
    currentImagesCount: currentImages.length
  });

  // Use the image analysis hook
  const {
    analysisInProgress,
    processImages
  } = useImageAnalysis({
    componentId,
    componentName,
    roomType,
    onImagesProcessed,
    onProcessingStateChange,
    processComponentImage
  });

  // Process the staged images
  const handleProcessImages = async () => {
    try {
      if (await processImages(stagingImages)) {
        clearStagingImages();
      }
    } catch (error) {
      console.error("Error processing images:", error);
    }
  };

  // Cancel the staging process
  const cancelStagingImages = () => {
    clearStagingImages();
  };

  return {
    stagingImages,
    analysisInProgress,
    compressionInProgress,
    totalImages,
    maxImages: MAX_IMAGES,
    canAddMore,
    handleImageCapture,
    handleCameraCapture,
    handleRemoveStagingImage,
    moveImage,
    processImages: handleProcessImages,
    cancelStagingImages
  };
}
