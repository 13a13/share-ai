
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { RoomComponent } from "@/types";
import ImageFileInput from "./ImageFileInput";
import { processComponentImage } from "@/services/imageProcessingService";

interface ComponentImageCaptureProps {
  componentId: string;
  roomType: string;
  componentType: string;
  isProcessing: boolean;
  onImageProcessed: (componentId: string, imageUrl: string, result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
}

const ComponentImageCapture = ({ 
  componentId, 
  roomType, 
  componentType, 
  isProcessing,
  onImageProcessed,
  onProcessingStateChange
}: ComponentImageCaptureProps) => {
  const { toast } = useToast();

  const processImage = async (imageUrl: string) => {
    onProcessingStateChange(componentId, true);
    
    try {
      const result = await processComponentImage(imageUrl, roomType, componentType);
      onImageProcessed(componentId, imageUrl, result);
      
      toast({
        title: "Image processed successfully",
        description: `AI has analyzed the image`,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error processing image",
        description: "AI analysis failed. Please try again or check your internet connection.",
        variant: "destructive",
      });
      
      // Even if AI fails, still add the image without AI data
      onImageProcessed(componentId, imageUrl, {
        description: "",
        condition: "fair",
        notes: "AI analysis failed - please add description manually"
      });
    } finally {
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
      await processImage(imageUrl);
    };
    
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async (imageData: string) => {
    await processImage(imageData);
  };

  return (
    <ImageFileInput
      id={`image-upload-${componentId}`}
      isProcessing={isProcessing}
      onChange={handleImageCapture}
      onImageCapture={handleCameraCapture}
    />
  );
};

export default ComponentImageCapture;
