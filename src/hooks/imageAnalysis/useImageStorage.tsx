
/**
 * Image storage operations separated from processing logic
 */

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadMultipleReportImages, checkStorageBucket } from "@/utils/supabaseStorage";
import { RoomImageAPI } from "@/lib/api/reports/roomImageApi";
import { resolvePropertyAndRoomNames } from "@/utils/storage/resolveNames";

interface UseImageStorageProps {
  propertyName?: string;
  roomName?: string;
}

export function useImageStorage({
  propertyName: initialPropName,
  roomName: initialRmName
}: UseImageStorageProps) {
  const { toast } = useToast();
  const [resolvedNames, setResolvedNames] = useState<{propertyName: string; roomName: string} | null>(null);

  useEffect(() => {
    async function resolveNames() {
      const roomElement = document.querySelector('[data-room-id]');
      const roomId = roomElement?.getAttribute('data-room-id') || "";
      
      if (roomId) {
        console.log("🔄 useImageStorage: Resolving names for roomId:", roomId);
        const result = await resolvePropertyAndRoomNames(roomId, initialPropName, initialRmName);
        setResolvedNames(result);
        console.log("✅ useImageStorage: Names resolved:", result);
      }
    }
    resolveNames();
  }, [initialPropName, initialRmName]);

  const uploadAndStoreImages = async (
    stagingImages: string[],
    componentName: string
  ): Promise<string[]> => {
    if (!resolvedNames) {
      throw new Error("Names not resolved yet");
    }

    const roomElement = document.querySelector('[data-room-id]');
    const reportElement = document.querySelector('[data-report-id]');
    const roomId = roomElement?.getAttribute('data-room-id');
    const reportId = reportElement?.getAttribute('data-report-id');

    if (!reportId || !roomId) {
      throw new Error("Report or room ID not found");
    }

    // Step 1: Check storage availability 
    console.log("🔍 Step 1: Checking storage availability...");
    const storageAvailable = await checkStorageBucket();
    
    if (!storageAvailable) {
      console.error("❌ Storage bucket not available");
      toast({
        title: "Storage Error",
        description: "Image storage is not available. Images will be processed locally.",
        variant: "destructive",
      });
      return stagingImages;
    }

    console.log("✅ Storage bucket confirmed available");

    // Step 2: Upload images to storage with organized folder structure
    console.log(`📤 Step 2: Uploading images to organized folders: ${resolvedNames.propertyName}/${resolvedNames.roomName}/${componentName}...`);
    
    try {
      const storedImageUrls = await uploadMultipleReportImages(
        stagingImages,
        reportId,
        roomId,
        resolvedNames.propertyName,
        resolvedNames.roomName,
        componentName
      );
      
      const successfulUploads = storedImageUrls.filter(url => !url.startsWith('data:')).length;
      const failedUploads = storedImageUrls.filter(url => url.startsWith('data:')).length;
      
      console.log(`📊 Upload verification: ${successfulUploads}/${stagingImages.length} images uploaded to ${resolvedNames.propertyName}/${resolvedNames.roomName}/${componentName}`);
      
      if (failedUploads > 0) {
        console.warn(`⚠️ ${failedUploads} images failed to upload, proceeding with local storage`);
      }

      // Step 3: Save image records to database (only for successfully uploaded images)
      console.log("💾 Step 3: Saving image records to database...");
      const savedImages = [];
      const storageUrls = storedImageUrls.filter(url => !url.startsWith('data:'));
      
      for (const imageUrl of storageUrls) {
        try {
          const savedImage = await RoomImageAPI.addImageToRoom(reportId, roomId, imageUrl);
          if (savedImage) {
            savedImages.push(savedImage);
            console.log(`✅ Image saved to database with ID: ${savedImage.id}`);
          }
        } catch (dbError) {
          console.error("❌ Failed to save image to database:", dbError);
        }
      }
      
      console.log(`📊 Database save results: ${savedImages.length}/${storageUrls.length} images saved`);
      
      return storedImageUrls;
    } catch (uploadError) {
      console.error("❌ Upload failed, proceeding with local images:", uploadError);
      return stagingImages;
    }
  };

  return {
    resolvedNames,
    uploadAndStoreImages
  };
}
