
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

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      if (!e.target?.result) return;
      
      const imageUrl = e.target.result as string;
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
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        onProcessingStateChange(componentId, false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <ImageFileInput
      id={`image-upload-${componentId}`}
      isProcessing={isProcessing}
      onChange={handleImageCapture}
    />
  );
};

export default ComponentImageCapture;
