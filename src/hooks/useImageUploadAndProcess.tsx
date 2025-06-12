
import { useState } from "react";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { useStagingImages } from "./useStagingImages";
import { useImageAnalysis } from "./useImageAnalysis";

interface UseImageUploadAndProcessProps {
  componentId: string;
  componentName: string;
  roomType: string;
  propertyName?: string;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<ProcessedImageResult>;
}

export function useImageUploadAndProcess({
  componentId,
  componentName,
  roomType,
  propertyName,
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

  // Use the image analysis hook with property name
  const {
    analysisInProgress,
    processImages
  } = useImageAnalysis({
    componentId,
    componentName,
    roomType,
    propertyName,
    onImagesProcessed,
    onProcessingStateChange,
    processComponentImage
  });

  // Process the staged images
  const handleProcessImages = async () => {
    if (await processImages(stagingImages)) {
      clearStagingImages();
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
