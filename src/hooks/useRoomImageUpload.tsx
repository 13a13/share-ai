
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI, GeminiAPI } from "@/lib/api";
import { Room } from "@/types";
import { compressImageFile } from "@/utils/imageCompression";
import { uploadReportImage, checkStorageBucket } from "@/utils/supabaseStorage";

interface UseRoomImageUploadProps {
  reportId: string;
  roomId: string;
  propertyName?: string;
  roomName?: string;
  onImageProcessed: (updatedRoom: Room) => void;
}

export const useRoomImageUpload = ({ 
  reportId, 
  roomId, 
  propertyName,
  roomName,
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
      console.error("Error compressing image:", error);
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
      console.error("Error processing camera image:", error);
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
      console.log(`🚀 Processing and uploading room image for:`, {
        reportId,
        roomId,
        propertyName: propertyName || "NO_PROPERTY_NAME",
        roomName: roomName || "NO_ROOM_NAME"
      });
      
      // Check if storage bucket is available
      const storageAvailable = await checkStorageBucket();
      let finalImageUrl = imageUrl;
      
      if (storageAvailable) {
        try {
          // Upload to Supabase Storage with user-organized folder structure
          // Use 'room_photos' as component name for room-level photos
          finalImageUrl = await uploadReportImage(
            imageUrl, 
            reportId, 
            roomId, 
            propertyName || "unknown_property", 
            roomName || "unknown_room", 
            'room_photos'
          );
          console.log("✅ Room image uploaded to organized folder successfully:", finalImageUrl);
        } catch (storageError) {
          console.warn("⚠️ Storage upload failed, using original URL:", storageError);
          finalImageUrl = imageUrl;
        }
      } else {
        console.warn("⚠️ Storage bucket not available, using original image URL");
      }
      
      // Add the image to the room using the final URL
      const image = await ReportsAPI.addImageToRoom(reportId, roomId, finalImageUrl);
      
      if (image) {
        setUploadedImageId(image.id);
        setUploadedImage(finalImageUrl);
        
        const storageStatus = storageAvailable && finalImageUrl !== imageUrl ? 
          `uploaded to ${propertyName || 'unknown_property'}/${roomName || 'unknown_room'}/room_photos folder` : "saved locally";
        
        toast({
          title: "Image uploaded",
          description: `Image has been added to the room and ${storageStatus}`,
        });
      }
      
      setIsUploading(false);
    } catch (error) {
      console.error("Error uploading room image:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem processing your image",
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
