
import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RoomComponent } from "@/types";

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
        const response = await fetch(`${window.location.origin}/supabase-functions/process-room-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl,
            roomType,
            componentType
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to process image: ${errorText}`);
        }
        
        const result = await response.json();
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
    <div className="relative">
      <input
        type="file" 
        id={`image-upload-${componentId}`} 
        accept="image/*"
        className="sr-only"
        onChange={handleImageCapture}
        disabled={isProcessing}
      />
      <label 
        htmlFor={`image-upload-${componentId}`}
        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-shareai-teal hover:bg-shareai-teal/90 cursor-pointer"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : (
          <div className="flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            Upload Photo
          </div>
        )}
      </label>
    </div>
  );
};

export default ComponentImageCapture;
