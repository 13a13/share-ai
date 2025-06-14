import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { uploadMultipleReportImages, checkStorageBucket } from "@/utils/supabaseStorage";
import { useUltraFastBatchSaving } from "./useUltraFastBatchSaving";
import { RoomImageAPI } from "@/lib/api/reports/roomImageApi";
import { supabase } from "@/integrations/supabase/client";
import { resolvePropertyAndRoomNames } from "@/utils/storage/resolveNames";

interface UseImageAnalysisProps {
  componentId: string;
  componentName: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<ProcessedImageResult>;
}

export function useImageAnalysis({
  componentId,
  componentName,
  roomType,
  propertyName: initialPropName,
  roomName: initialRmName,
  onImagesProcessed,
  onProcessingStateChange,
  processComponentImage
}: UseImageAnalysisProps) {
  const { toast } = useToast();
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const { queueComponentUpdate, isSaving, getPendingCount } = useUltraFastBatchSaving();

  // Ensure actual property, room name available for upload
  const [propertyName, setPropertyName] = useState(initialPropName ?? "");
  const [roomName, setRoomName] = useState(initialRmName ?? "");
  const [namesLoaded, setNamesLoaded] = useState(false);

  useEffect(() => {
    async function fetchNamesIfNeeded() {
      // Always ensure we have the true (non-blank) names for uploads
      const roomElement = document.querySelector('[data-room-id]');
      const roomId = roomElement?.getAttribute('data-room-id') || "";
      const result = await resolvePropertyAndRoomNames(
        roomId,
        initialPropName,
        initialRmName
      );
      setPropertyName(result.propertyName);
      setRoomName(result.roomName);
      setNamesLoaded(true);
    }
    fetchNamesIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPropName, initialRmName]);

  const processImages = async (stagingImages: string[]) => {
    if (!stagingImages || stagingImages.length === 0) return false;
    if (!namesLoaded) return false;

    // Use true (non-blank) names always for upload path
    const truePropName = propertyName;
    const trueRoomName = roomName;
    const roomElement = document.querySelector('[data-room-id]');
    const reportElement = document.querySelector('[data-report-id]');
    const roomId = roomElement?.getAttribute('data-room-id');
    const reportId = reportElement?.getAttribute('data-report-id');

    console.log(`🚀 Starting image analysis for ${stagingImages.length} images in component ${componentName} for property: ${propertyName}, room: ${roomName}`);
    
    onProcessingStateChange(componentId, true);
    setAnalysisInProgress(true);
    
    try {
      // Get reportId and roomId from the DOM
      if (!reportElement || !roomElement) {
        console.error("Could not find report-id or room-id in DOM");
        throw new Error("Report or room ID not found");
      }
      
      console.log(`📍 Processing images for report: ${reportId}, room: ${roomId}, component: ${componentId}, property: ${propertyName}, roomName: ${roomName}, componentName: ${componentName}`);
      
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
        // Continue with local processing
      } else {
        console.log("✅ Storage bucket confirmed available");
      }
      
      // Step 2: Upload images to storage with organized folder structure
      console.log(`📤 Step 2: Uploading images to organized folders: ${truePropName}/${trueRoomName}/${componentName}...`);
      let storedImageUrls = stagingImages;
      
      if (storageAvailable) {
        try {
          storedImageUrls = await uploadMultipleReportImages(
            stagingImages,
            reportId,
            roomId,
            truePropName,
            trueRoomName,
            componentName
          );
          
          // Verify upload success
          const successfulUploads = storedImageUrls.filter(url => !url.startsWith('data:')).length;
          const failedUploads = storedImageUrls.filter(url => url.startsWith('data:')).length;
          
          console.log(`📊 Upload verification: ${successfulUploads}/${stagingImages.length} images uploaded to ${truePropName}/${trueRoomName}/${componentName}`);
          
          if (failedUploads > 0) {
            console.warn(`⚠️ ${failedUploads} images failed to upload, proceeding with local storage`);
          }
        } catch (uploadError) {
          console.error("❌ Upload failed, proceeding with local images:", uploadError);
          storedImageUrls = stagingImages;
        }
      }
      
      // Step 3: Save image records to database (only for successfully uploaded images)
      if (storageAvailable) {
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
      }
      
      // Step 4: Process images with AI
      console.log("🤖 Step 4: Processing images with AI...");
      const result = await processComponentImage(storedImageUrls, roomType, componentName, true);
      console.log("✅ AI processing completed:", result);
      
      // Step 5: Queue the update for ultra-fast batch saving
      console.log("⚡ Step 5: Queueing component update...");
      queueComponentUpdate(
        reportId,
        componentId,
        storedImageUrls,
        result.description || "",
        result.condition || { summary: "", points: [], rating: "fair" },
        result
      );
      
      // Step 6: Update UI immediately
      onImagesProcessed(componentId, storedImageUrls, result);
      
      const pendingCount = getPendingCount();
      const successfulUploads = storedImageUrls.filter(url => !url.startsWith('data:')).length;
      
      console.log(`🎉 Processing complete: ${stagingImages.length} images analyzed, ${successfulUploads} uploaded to ${truePropName}/${trueRoomName}/${componentName}, ${pendingCount} updates queued`);
      
      // Show success message
      toast({
        title: "Images processed successfully",
        description: `AI analyzed ${stagingImages.length} image(s)${storageAvailable ? ` and uploaded ${successfulUploads} to ${truePropName}/${trueRoomName}/${componentName}` : ' (stored locally)'}. ${pendingCount} updates queued for saving.`,
      });
      
      return true;
    } catch (error) {
      console.error("❌ Error in image processing pipeline:", error);
      
      // Provide more specific error messages
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Report or room ID")) {
          errorMessage = "Could not identify the current report and room. Please refresh the page.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error processing images",
        description: `Failed to process images: ${errorMessage}`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      onProcessingStateChange(componentId, false);
      setAnalysisInProgress(false);
    }
  };

  return {
    analysisInProgress: analysisInProgress || isSaving,
    processImages,
    pendingUpdatesCount: getPendingCount()
  };
}
