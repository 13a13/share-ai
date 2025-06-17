import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
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

  const [resolvedNames, setResolvedNames] = useState<{propertyName: string; roomName: string} | null>(null);

  // Resolve names immediately on mount and when IDs change
  useEffect(() => {
    const resolveNames = async () => {
      console.log(`🔄 [HOOK v4] useRoomImageUpload: Resolving names for roomId: ${roomId}`);
      try {
        const resolved = await resolvePropertyAndRoomNames(roomId, propName, rmName);
        setResolvedNames(resolved);
        console.log(`✅ [HOOK v4] useRoomImageUpload: Names resolved:`, resolved);
        
        // Check for problematic resolutions
        if (resolved.propertyName.startsWith('error_') || resolved.roomName.startsWith('error_') ||
            resolved.propertyName === 'unknown_property' || resolved.roomName === 'unknown_room') {
          console.error(`🚨 [HOOK v4] Problematic name resolution in hook:`, {
            roomId, propName, rmName, resolved
          });
        }
      } catch (error) {
        console.error(`❌ [HOOK v4] Error resolving names:`, error);
        setResolvedNames({ propertyName: "error_hook", roomName: "error_hook" });
      }
    };
    
    if (roomId) {
      resolveNames();
    }
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

  const handleMultipleImagesProcess = async (imageDataUrls: string[]) => {
    if (!imageDataUrls || imageDataUrls.length === 0) return;

    setIsProcessing(true);

    try {
      // Ensure we have resolved names before uploading
      if (!resolvedNames) {
        console.log(`🔄 [HOOK v4] handleMultipleImagesProcess: Re-resolving names...`);
        const freshlyResolved = await resolvePropertyAndRoomNames(roomId, propName, rmName);
        setResolvedNames(freshlyResolved);
        console.log(`✅ [HOOK v4] handleMultipleImagesProcess: Fresh resolution:`, freshlyResolved);
      }

      const namesToUse = resolvedNames || { propertyName: "fallback_property", roomName: "fallback_room" };

      console.log(`🔄 [HOOK v4] Processing ${imageDataUrls.length} images for room: ${roomId}, report: ${reportId}, with names:`, namesToUse);

      const storageAvailable = await checkStorageBucket();
      const processedImageUrls: string[] = [];
      const imageIds: string[] = [];

      // Process each image
      for (let i = 0; i < imageDataUrls.length; i++) {
        const imageUrl = imageDataUrls[i];
        console.log(`📸 [HOOK v4] Processing image ${i + 1}/${imageDataUrls.length}`);

        try {
          // Compress the image first
          const fileName = `room-batch-${Date.now()}-${i}.jpg`;
          const blob = await (await fetch(imageUrl)).blob();
          const compressedDataUrl = await compressImageFile(
            new File([blob], fileName, { type: 'image/jpeg' })
          );

          let finalImageUrl = compressedDataUrl;

          // Upload to storage if available
          if (storageAvailable) {
            try {
              console.log(`📤 [HOOK v4] Uploading image ${i + 1} with resolved names:`, namesToUse);
              finalImageUrl = await uploadReportImage(
                compressedDataUrl, 
                reportId, 
                roomId, 
                namesToUse.propertyName, 
                namesToUse.roomName, 
                'general'
              );
              console.log(`✅ [HOOK v4] Image ${i + 1} uploaded successfully:`, finalImageUrl);
            } catch (storageError) {
              console.warn(`⚠️ [HOOK v4] Storage upload failed for image ${i + 1}, using compressed URL:`, storageError);
              finalImageUrl = compressedDataUrl;
            }
          }

          // Add to database
          const image = await ReportsAPI.addImageToRoom(reportId, roomId, finalImageUrl);
          if (image) {
            processedImageUrls.push(finalImageUrl);
            imageIds.push(image.id);
          }
        } catch (error) {
          console.error(`❌ [HOOK v4] Error processing image ${i + 1}:`, error);
          // Continue processing remaining images
        }
      }

      if (processedImageUrls.length === 0) {
        throw new Error("No images were successfully processed");
      }

      // Process with AI using ALL image IDs for multi-image analysis
      console.log(`🤖 [HOOK v4] Processing ${processedImageUrls.length} images with AI using ALL image IDs:`, imageIds);
      const updatedRoom = await GeminiAPI.processMultipleRoomImages(reportId, roomId, imageIds);
      
      if (updatedRoom) {
        const storageStatus = storageAvailable ? 
          `uploaded to organized folder: ${namesToUse.propertyName}/${namesToUse.roomName}` : "saved locally";

        toast({
          title: "Multiple images processed together",
          description: `AI analyzed ${processedImageUrls.length} room photo${processedImageUrls.length !== 1 ? 's' : ''} together and ${storageStatus}`,
        });
        
        onImageProcessed(updatedRoom);
      } else {
        toast({
          title: "Processing completed with limitations",
          description: `${processedImageUrls.length} image${processedImageUrls.length !== 1 ? 's' : ''} uploaded successfully, but AI analysis had issues. You can edit room details manually.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`❌ [HOOK v4] Error in multiple images processing:`, error);
      toast({
        title: "Processing failed",
        description: "There was a problem processing your images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (imageUrl: string) => {
    try {
      // Ensure we have resolved names before uploading
      if (!resolvedNames) {
        console.log(`🔄 [HOOK v4] processImage: Re-resolving names...`);
        const freshlyResolved = await resolvePropertyAndRoomNames(roomId, propName, rmName);
        setResolvedNames(freshlyResolved);
        console.log(`✅ [HOOK v4] processImage: Fresh resolution:`, freshlyResolved);
      }

      const namesToUse = resolvedNames || { propertyName: "fallback_property", roomName: "fallback_room" };

      console.log(`🔄 [HOOK v4] Processing and uploading image for room: ${roomId}, report: ${reportId}, with names:`, namesToUse);

      const storageAvailable = await checkStorageBucket();
      let finalImageUrl = imageUrl;

      if (storageAvailable) {
        try {
          console.log(`📤 [HOOK v4] Uploading with resolved names:`, namesToUse);
          finalImageUrl = await uploadReportImage(
            imageUrl, 
            reportId, 
            roomId, 
            namesToUse.propertyName, 
            namesToUse.roomName, 
            'general'
          );
          console.log(`✅ [HOOK v4] Image uploaded successfully:`, finalImageUrl);
          
          // Validate the uploaded URL contains the correct folder structure
          if (finalImageUrl.includes('unknown_property') || finalImageUrl.includes('unknown_room')) {
            console.error(`🚨 [HOOK v4] UPLOADED IMAGE STILL HAS GENERIC FOLDER NAMES!`, {
              uploadedUrl: finalImageUrl,
              expectedProperty: namesToUse.propertyName,
              expectedRoom: namesToUse.roomName
            });
            toast({
              title: "Upload Warning",
              description: `Image uploaded but folder structure may be incorrect. Expected: ${namesToUse.propertyName}/${namesToUse.roomName}`,
              variant: "destructive",
            });
          }
        } catch (storageError) {
          console.warn(`⚠️ [HOOK v4] Storage upload failed, using original URL:`, storageError);
          finalImageUrl = imageUrl;
        }
      } else {
        console.warn(`⚠️ [HOOK v4] Storage bucket not available, using original image URL`);
      }

      const image = await ReportsAPI.addImageToRoom(reportId, roomId, finalImageUrl);

      if (image) {
        setUploadedImageId(image.id);
        setUploadedImage(finalImageUrl);

        const storageStatus = storageAvailable && finalImageUrl !== imageUrl ?
          `uploaded to organized folder: ${namesToUse.propertyName}/${namesToUse.roomName}` : "saved locally";

        toast({
          title: "Image uploaded",
          description: `Image has been added to the room and ${storageStatus}`,
        });
      }

      setIsUploading(false);
    } catch (error) {
      console.error(`❌ [HOOK v4] Error uploading image:`, error);
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
      const updatedRoom = await GeminiAPI.processRoomImage(reportId, roomId, uploadedImageId);
      
      if (updatedRoom) {
        toast({
          title: "Image processed",
          description: "AI has analyzed the image and updated the room details",
        });
        
        setUploadedImage(null);
        setUploadedImageId(null);
        
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
    handleMultipleImagesProcess,
    handleProcessWithAI,
    resetUpload
  };
};
