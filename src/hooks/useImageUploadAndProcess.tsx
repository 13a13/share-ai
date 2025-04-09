
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { compressDataURLImage } from "@/utils/imageCompression";

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
  const [compressionInProgress, setCompressionInProgress] = useState(false);

  const MAX_IMAGES = 20;
  const totalImages = currentImages.length + stagingImages.length;
  const canAddMore = totalImages < MAX_IMAGES;

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Handle multiple file selection
    const files = Array.from(event.target.files);
    const maxFilesToAdd = MAX_IMAGES - totalImages;
    
    if (maxFilesToAdd <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can upload a maximum of ${MAX_IMAGES} images per component.`,
        variant: "destructive",
      });
      return;
    }
    
    // Process up to maxFilesToAdd images
    const filesToProcess = files.slice(0, maxFilesToAdd);
    
    setCompressionInProgress(true);
    
    try {
      const newImages: string[] = [];
      
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) continue;
        
        // Create a data URL for the image
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        });
        
        // Compress the image
        const fileName = file.name || `image-${Date.now()}.jpg`;
        const compressedDataUrl = await compressDataURLImage(dataUrl, fileName);
        newImages.push(compressedDataUrl);
      }
      
      if (newImages.length > 0) {
        setStagingImages([...stagingImages, ...newImages]);

        if (newImages.length < filesToProcess.length) {
          toast({
            title: "Some files skipped",
            description: "Only image files were added to the upload queue.",
          });
        }
      }
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Error processing images",
        description: "Some images could not be processed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompressionInProgress(false);
      
      // Clear input value to allow selecting the same file again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    if (totalImages >= MAX_IMAGES) {
      toast({
        title: "Maximum images reached",
        description: `You can upload a maximum of ${MAX_IMAGES} images per component.`,
        variant: "destructive",
      });
      return;
    }
    
    setCompressionInProgress(true);
    
    try {
      // Compress the camera-captured image
      const fileName = `camera-${Date.now()}.jpg`;
      const compressedDataUrl = await compressDataURLImage(imageData, fileName);
      setStagingImages([...stagingImages, compressedDataUrl]);
    } catch (error) {
      console.error("Error processing camera image:", error);
      toast({
        title: "Error processing image",
        description: "The captured image could not be processed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompressionInProgress(false);
    }
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

  return {
    stagingImages,
    analysisInProgress,
    compressionInProgress,
    totalImages,
    canAddMore,
    maxImages: MAX_IMAGES,
    handleImageCapture,
    handleCameraCapture,
    handleRemoveStagingImage,
    moveImage,
    processImages,
    cancelStagingImages
  };
}
