import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI, GeminiAPI } from "@/lib/api";
import { Room } from "@/types";
import { compressImageFile } from "@/utils/imageCompression";
import { uploadReportImage, checkStorageBucket } from "@/utils/supabaseStorage";
import { supabase } from "@/integrations/supabase/client";

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

  // --- NEW: Fetch real property/room name if blank
  const [propertyName, setPropertyName] = useState(propName ?? "");
  const [roomName, setRoomName] = useState(rmName ?? "");

  useEffect(() => {
    async function fetchNamesIfNeeded() {
      if ((!propertyName || propertyName === "unknown_property" || propertyName.trim() === "") && supabase && roomId) {
        try {
          const { data, error } = await supabase
            .from('rooms')
            .select('id, name, property_id, properties(name)')
            .eq('id', roomId)
            .maybeSingle();
          if (data) {
            setRoomName(data.name ?? "");
            setPropertyName(data.properties?.name ?? "");
          }
        } catch (err) {}
      }
    }
    fetchNamesIfNeeded();
  }, [roomId, propertyName, roomName]);

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
      // ------------- MAIN UPLOAD: make sure property/room names are NOT blank -------------
      let propNameFinal = propertyName && propertyName.trim() !== "" ? propertyName : "unknown_property";
      let roomNameFinal = roomName && roomName.trim() !== "" ? roomName : "unknown_room";
      if ((!propertyName || propertyName.trim() === "") && propName && propName.trim() !== "") {
        propNameFinal = propName;
      }
      if ((!roomName || roomName.trim() === "") && rmName && rmName.trim() !== "") {
        roomNameFinal = rmName;
      }

      console.log("Processing and uploading image for room:", roomId, "in report:", reportId, "property:", propNameFinal, "roomName:", roomNameFinal);
      
      // Check if storage bucket is available
      const storageAvailable = await checkStorageBucket();
      let finalImageUrl = imageUrl;
      
      if (storageAvailable) {
        try {
          // Upload to Supabase Storage with user-organized folder structure (user/property/room/general for room photos)
          finalImageUrl = await uploadReportImage(imageUrl, reportId, roomId, propNameFinal, roomNameFinal, 'general');
          console.log("✅ Image uploaded to user-organized folder successfully:", finalImageUrl);
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
