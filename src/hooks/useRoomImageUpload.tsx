import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI, GeminiAPI } from "@/lib/api";
import { Room } from "@/types";
import { compressImageFile } from "@/utils/imageCompression";
import { uploadReportImage, checkStorageBucket } from "@/utils/supabaseStorage";
import { supabase } from "@/integrations/supabase/client";
import { resolvePropertyAndRoomNames } from "@/utils/storage/resolveNames";

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
  propertyName: propName,
  roomName: rmName,
  onImageProcessed 
}: UseRoomImageUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);

  const [propertyName, setPropertyName] = useState(propName ?? "");
  const [roomName, setRoomName] = useState(rmName ?? "");

  // Guarantee property/room names are always loaded for uploads
  const refreshNames = async () => {
    const { propertyName: resolvedProp, roomName: resolvedRoom } =
      await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    setPropertyName(resolvedProp);
    setRoomName(resolvedRoom);
    return { resolvedProp, resolvedRoom };
  };

  useEffect(() => {
    // On mount or when IDs/names change, always fetch up-to-date values
    refreshNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, propName, rmName]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

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
      const compressedDataUrl = await compressImageFile(file);
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

  // This method guarantees correct names before upload
  const processImage = async (imageUrl: string) => {
    try {
      const { resolvedProp, resolvedRoom } = await refreshNames();
      const propNameFinal = resolvedProp;
      const roomNameFinal = resolvedRoom;

      console.log("Processing and uploading image for room:", roomId, "report:", reportId, "property:", propNameFinal, "roomName:", roomNameFinal);

      const storageAvailable = await checkStorageBucket();
      let finalImageUrl = imageUrl;

      if (storageAvailable) {
        try {
          finalImageUrl = await uploadReportImage(imageUrl, reportId, roomId, propNameFinal, roomNameFinal, 'general');
          console.log("✅ Image uploaded to user-organized folder successfully:", finalImageUrl);
        } catch (storageError) {
          console.warn("⚠️ Storage upload failed, using original URL:", storageError);
          finalImageUrl = imageUrl;
        }
      } else {
        console.warn("⚠️ Storage bucket not available, using original image URL");
      }

      const image = await ReportsAPI.addImageToRoom(reportId, roomId, finalImageUrl);

      if (image) {
        setUploadedImageId(image.id);
        setUploadedImage(finalImageUrl);

        const storageStatus = storageAvailable && finalImageUrl !== imageUrl ?
          `uploaded to user's account folder in Supabase Storage` : "saved locally";

        toast({
          title: "Image uploaded",
          description: `Image has been added to the room and ${storageStatus}`,
        });
      }

      setIsUploading(false);
    } catch (error) {
      console.error("Error uploading image:", error);
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
