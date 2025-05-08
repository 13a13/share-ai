
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI, GeminiAPI } from "@/lib/api";
import { Room } from "@/types";
import { compressImageFile } from "@/utils/imageCompression";

interface UseRoomImageUploadProps {
  reportId: string;
  roomId: string;
  onImageProcessed: (updatedRoom: Room) => void;
}

export const useRoomImageUpload = ({ 
  reportId, 
  roomId, 
  onImageProcessed 
}: UseRoomImageUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Compress the image first
      const compressedDataUrl = await compressImageFile(file);
      
      // Process the compressed image
      await processImage(compressedDataUrl);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem processing your image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    setIsUploading(true);
    
    try {
      // Compress the camera-captured image
      const fileName = `camera-${Date.now()}.jpg`;
      const blob = await (await fetch(imageData)).blob();
      const compressedDataUrl = await compressImageFile(
        new File([blob], fileName, { type: 'image/jpeg' })
      );
      
      await processImage(compressedDataUrl);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem processing your image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  const processImage = async (imageUrl: string) => {
    try {
      console.log("Adding image to room:", roomId);
      
      // Add the image to the room - this will handle storage of the image
      const image = await ReportsAPI.addImageToRoom(reportId, roomId, imageUrl);
      
      if (image) {
        setUploadedImageId(image.id);
        setUploadedImage(image.url);
        toast({
          title: "Image uploaded",
          description: "Image has been added to the room and stored in Supabase",
        });
      }
      
      setIsUploading(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  const handleProcessWithAI = async () => {
    if (!uploadedImageId) return;
    
    setIsProcessing(true);
    
    try {
      // Process the image with Gemini AI
      const updatedRoom = await GeminiAPI.processRoomImage(reportId, roomId, uploadedImageId);
      
      if (updatedRoom) {
        toast({
          title: "Image processed",
          description: "AI has analyzed the image and updated the room details",
        });
        
        // Reset the uploader
        setUploadedImage(null);
        setUploadedImageId(null);
        
        // Notify parent component
        onImageProcessed(updatedRoom);
      } else {
        toast({
          title: "Processing failed",
          description: "AI analysis was unable to process this image. You can still edit room details manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing failed",
        description: "There was a problem processing your image with AI. You can still edit room details manually.",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setUploadedImageId(null);
  };

  return {
    isUploading,
    isProcessing,
    uploadedImage,
    handleFileUpload,
    handleCameraCapture,
    handleProcessWithAI,
    resetUpload
  };
};
