
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { RoomComponent } from "@/types";
import ImageFileInput from "./ImageFileInput";
import { processComponentImage } from "@/services/imageProcessingService";
import { Button } from "./ui/button";
import { Camera, Image, Trash2 } from "lucide-react";

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
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      if (!e.target?.result) return;
      const imageUrl = e.target.result as string;
      
      if (currentImages.length + stagingImages.length >= 5) {
        toast({
          title: "Maximum images reached",
          description: "You can upload a maximum of 5 images per component.",
          variant: "destructive",
        });
        return;
      }
      
      setStagingImages([...stagingImages, imageUrl]);
    };
    
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async (imageData: string) => {
    if (currentImages.length + stagingImages.length >= 5) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 5 images per component.",
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
  const canAddMore = totalImages < 5;

  return (
    <div className="space-y-4">
      {stagingImages.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Preview Images ({stagingImages.length})</div>
          <div className="grid grid-cols-3 gap-2">
            {stagingImages.map((image, index) => (
              <div key={index} className="relative group border rounded overflow-hidden">
                <img 
                  src={image} 
                  alt={`Preview ${index + 1}`} 
                  className="w-full h-24 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveStagingImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
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
              {isProcessing ? "Processing..." : "Analyze Images"}
            </Button>
          </div>
        </div>
      )}
      
      {canAddMore && (
        <div className="flex flex-wrap gap-2">
          <ImageFileInput
            id={`image-upload-${componentId}`}
            isProcessing={isProcessing}
            onChange={handleImageCapture}
            onImageCapture={handleCameraCapture}
          />
          <div className="text-sm text-gray-500 mt-1">
            {totalImages}/5 images
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentImageCapture;
