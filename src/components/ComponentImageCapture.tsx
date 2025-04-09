
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import ImageFileInput from "./ImageFileInput";
import { processComponentImage } from "@/services/imageProcessingService";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface ComponentImageCaptureProps {
  componentId: string;
  roomType: string;
  componentType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemovePreviewImage: (index: number) => void;
}

const ComponentImageCapture = ({ 
  componentId, 
  roomType, 
  componentType, 
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemovePreviewImage
}: ComponentImageCaptureProps) => {
  const { toast } = useToast();
  const [stagingImages, setStagingImages] = useState<string[]>([]);
  const MAX_IMAGES = 20;  // Updated to 20 images

  const processImages = async (imageUrls: string[]) => {
    if (imageUrls.length === 0) return;
    
    onProcessingStateChange(componentId, true);
    
    try {
      // Process all images together
      const result = await processComponentImage(imageUrls, roomType, componentType);
      onImagesProcessed(componentId, imageUrls, result);
      
      toast({
        title: "Images processed successfully",
        description: `AI has analyzed ${imageUrls.length} ${imageUrls.length === 1 ? 'image' : 'images'}`,
      });
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Error processing images",
        description: "AI analysis failed. Please try again or check your internet connection.",
        variant: "destructive",
      });
      
      // Even if AI fails, still add the images without AI data
      onImagesProcessed(componentId, imageUrls, {
        description: "",
        condition: {
          summary: "",
          rating: "fair"
        },
        notes: "AI analysis failed - please add description manually"
      });
    } finally {
      setStagingImages([]);
      onProcessingStateChange(componentId, false);
    }
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Handle multiple file selection
    const newImages: string[] = [];
    const maxFilesToAdd = MAX_IMAGES - (currentImages.length + stagingImages.length);
    
    if (maxFilesToAdd <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can upload a maximum of ${MAX_IMAGES} images per component.`,
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

    // Clear input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    const totalImages = currentImages.length + stagingImages.length;
    if (totalImages >= MAX_IMAGES) {
      toast({
        title: "Maximum images reached",
        description: `You can upload a maximum of ${MAX_IMAGES} images per component.`,
        variant: "destructive",
      });
      return;
    }
    
    setStagingImages([...stagingImages, imageData]);
  };

  const handleRemoveStagingImage = (index: number) => {
    setStagingImages(stagingImages.filter((_, i) => i !== index));
  };

  const handleConfirmImages = () => {
    if (stagingImages.length === 0) {
      toast({
        title: "No images to process",
        description: "Please add at least one image before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    processImages(stagingImages);
  };

  const totalImages = currentImages.length + stagingImages.length;
  const canAddMore = totalImages < MAX_IMAGES;

  return (
    <div className="space-y-4">
      {stagingImages.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Preview Images ({stagingImages.length})</div>
          <ScrollArea className="h-full max-h-[250px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {stagingImages.map((image, index) => (
                <div key={index} className="relative group border rounded overflow-hidden aspect-square">
                  <img 
                    src={image} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveStagingImage(index)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end space-x-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setStagingImages([])}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirmImages}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Analyze Images"
              )}
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <ImageFileInput
          id={`image-upload-${componentId}`}
          isProcessing={isProcessing}
          onChange={handleImageCapture}
          onImageCapture={handleCameraCapture}
          multiple={true}
          disabled={!canAddMore}
          totalImages={totalImages}
          maxImages={MAX_IMAGES}
        />
        <div className="text-sm text-gray-500 mt-1">
          {totalImages}/{MAX_IMAGES} images
        </div>
      </div>
    </div>
  );
};

export default ComponentImageCapture;
