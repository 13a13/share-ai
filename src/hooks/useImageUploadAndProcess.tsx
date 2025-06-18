
import { useState } from "react";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { useStagingImages } from "./useStagingImages";
import { useImageAnalysis } from "./useImageAnalysis";

interface UseImageUploadAndProcessProps {
  componentId: string;
  componentName: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
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
  roomName,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  processComponentImage
}: UseImageUploadAndProcessProps) {
  const MAX_IMAGES = 20;

  console.log(`🔍 useImageUploadAndProcess: propertyName="${propertyName}", roomName="${roomName}", componentName="${componentName}"`);

  // Use the staging images hook
  const {
    stagingImages,
    compressionInProgress,
    totalImages,
    canAddMore,
    handleImageCapture,
    handleCameraCapture, // Now supports both string and string[]
    handleRemoveStagingImage,
    moveImage,
    clearStagingImages
  } = useStagingImages({
    maxImages: MAX_IMAGES,
    currentImagesCount: currentImages.length
  });

  // Use the image analysis hook with property name and room name
  const {
    analysisInProgress,
    processImages
  } = useImageAnalysis({
    componentId,
    componentName,
    roomType,
    propertyName: propertyName || "unknown_property",
    roomName: roomName || "unknown_room",
    onImagesProcessed,
    onProcessingStateChange,
    processComponentImage
  });

  // Process the staged images
  const handleProcessImages = async () => {
    console.log(`🚀 Processing images for component "${componentName}" in property: "${propertyName}", room: "${roomName}"`);
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
    handleCameraCapture, // Now supports both string and string[]
    handleRemoveStagingImage,
    moveImage,
    processImages: handleProcessImages,
    cancelStagingImages
  };
}
