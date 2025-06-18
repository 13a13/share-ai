
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { compressDataURLImage } from "@/utils/imageCompression";
import { validateAndNormalizeImageInput } from "@/utils/imageInputValidation";
import { debugImageFlow } from "@/utils/debugImageFlow";

interface UseStagingImagesProps {
  maxImages: number;
  currentImagesCount: number;
}

export function useStagingImages({ maxImages, currentImagesCount }: UseStagingImagesProps) {
  const { toast } = useToast();
  const [stagingImages, setStagingImages] = useState<string[]>([]);
  const [compressionInProgress, setCompressionInProgress] = useState(false);

  const totalImages = currentImagesCount + stagingImages.length;
  const canAddMore = totalImages < maxImages;

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Handle multiple file selection
    const files = Array.from(event.target.files);
    const maxFilesToAdd = maxImages - totalImages;
    
    if (maxFilesToAdd <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can upload a maximum of ${maxImages} images per component.`,
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

  // ENHANCED: Handle both single string and array inputs with normalization
  const handleCameraCapture = async (imageData: string | string[]) => {
    debugImageFlow.logCapture('useStagingImages.handleCameraCapture', imageData, {
      currentStaging: stagingImages.length,
      totalImages,
      maxImages
    });

    // CRITICAL: Validate and normalize input first
    const validation = validateAndNormalizeImageInput(imageData, 'useStagingImages.handleCameraCapture');
    
    if (!validation.isValid) {
      console.error('❌ useStagingImages: Invalid image input:', validation.errors);
      toast({
        title: "Invalid image data",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ useStagingImages: Input warnings:', validation.warnings);
    }

    const normalizedImages = validation.normalizedImages;
    console.log(`📸 useStagingImages: Processing ${normalizedImages.length} validated image(s)`);
    
    if (totalImages >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can upload a maximum of ${maxImages} images per component.`,
        variant: "destructive",
      });
      return;
    }
    
    const availableSlots = maxImages - totalImages;
    const imagesToAdd = normalizedImages.slice(0, availableSlots);
    
    setCompressionInProgress(true);
    
    try {
      debugImageFlow.logProcessing('compression', imagesToAdd.length, { availableSlots });

      // Compress each camera-captured image
      const compressedImages = await Promise.all(
        imagesToAdd.map(async (img, index) => {
          const fileName = `camera-${Date.now()}-${index}.jpg`;
          return compressDataURLImage(img, fileName);
        })
      );
      
      setStagingImages([...stagingImages, ...compressedImages]);
      
      if (normalizedImages.length > availableSlots) {
        toast({
          title: "Not all images added",
          description: `Only ${availableSlots} of ${normalizedImages.length} images were added due to the limit.`,
        });
      }

      console.log(`✅ useStagingImages: Successfully added ${compressedImages.length} images to staging`);
    } catch (error) {
      debugImageFlow.logError('useStagingImages.handleCameraCapture', error, { imagesToAdd: imagesToAdd.length });
      console.error("Error processing camera images:", error);
      toast({
        title: "Error processing images",
        description: "The captured images could not be processed. Please try again.",
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

  const clearStagingImages = () => {
    setStagingImages([]);
  };

  return {
    stagingImages,
    setStagingImages,
    compressionInProgress,
    totalImages,
    canAddMore,
    handleImageCapture,
    handleCameraCapture, // Now supports both string and string[]
    handleRemoveStagingImage,
    moveImage,
    clearStagingImages
  };
}
