
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ProcessedImageResult } from "@/services/imageProcessingService";

interface UseImageUploadAndProcessProps {
  componentId: string;
  componentName: string;
  roomType: string;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<ProcessedImageResult>;
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
  const { toast } = useToast();
  const [stagingImages, setStagingImages] = useState<string[]>([]);
  const [analysisInProgress, setAnalysisInProgress] = useState(false);

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Handle multiple file selection
    const newImages: string[] = [];
    const maxFilesToAdd = 20 - (stagingImages.length + currentImages.length);
    
    if (maxFilesToAdd <= 0) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 20 images per component.",
        variant: "destructive",
      });
      return;
    }
    
    // Process up to maxFilesToAdd images
    const filesToProcess = Array.from(event.target.files).slice(0, maxFilesToAdd);
    
    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue;
      
      // Create a data URL for the image
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    if (newImages.length > 0) {
      setStagingImages([...stagingImages, ...newImages]);
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    if (stagingImages.length + currentImages.length >= 20) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 20 images per component.",
        variant: "destructive",
      });
      return;
    }
    
    setStagingImages([...stagingImages, imageData]);
  };

  const handleRemoveStagingImage = (index: number) => {
    setStagingImages(stagingImages.filter((_, i) => i !== index));
  };
  
  const moveImage = (dragIndex: number, hoverIndex: number) => {
    const draggedImage = stagingImages[dragIndex];
    const newImages = [...stagingImages];
    newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, draggedImage);
    setStagingImages(newImages);
  };

  const processImages = async () => {
    if (stagingImages.length === 0) return;
    
    onProcessingStateChange(componentId, true);
    setAnalysisInProgress(true);
    
    try {
      // Process all images together with the component name
      const result = await processComponentImage(stagingImages, roomType, componentName, true);
      onImagesProcessed(componentId, stagingImages, result);
      
      toast({
        title: "Images processed successfully",
        description: `AI has analyzed ${stagingImages.length} ${stagingImages.length === 1 ? 'image' : 'images'} for ${componentName}`,
      });
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Error processing images",
        description: "AI analysis failed. Please try again or check your internet connection.",
        variant: "destructive",
      });
      
      // Even if AI fails, still add the images without AI data
      onImagesProcessed(componentId, stagingImages, {
        description: "",
        condition: {
          summary: "",
          points: [],
          rating: "fair"
        },
        cleanliness: "domestic_clean",
        notes: "AI analysis failed - please add description manually"
      });
    } finally {
      setStagingImages([]);
      onProcessingStateChange(componentId, false);
      setAnalysisInProgress(false);
    }
  };

  const cancelStagingImages = () => {
    setStagingImages([]);
  };

  const totalImages = currentImages.length + stagingImages.length;
  const canAddMore = totalImages < 20;

  return {
    stagingImages,
    analysisInProgress,
    totalImages,
    canAddMore,
    handleImageCapture,
    handleCameraCapture,
    handleRemoveStagingImage,
    moveImage,
    processImages,
    cancelStagingImages
  };
}
