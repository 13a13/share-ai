
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { uploadMultipleReportImages, checkStorageBucket } from "@/utils/supabaseStorage";
import { useUltraFastBatchSaving } from "./useUltraFastBatchSaving";
import { RoomImageAPI } from "@/lib/api/reports/roomImageApi";

interface UseImageAnalysisProps {
  componentId: string;
  componentName: string;
  roomType: string;
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<ProcessedImageResult>;
}

export function useImageAnalysis({
  componentId,
  componentName,
  roomType,
  onImagesProcessed,
  onProcessingStateChange,
  processComponentImage
}: UseImageAnalysisProps) {
  const { toast } = useToast();
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const { queueComponentUpdate, isSaving, getPendingCount } = useUltraFastBatchSaving();

  const processImages = async (stagingImages: string[]) => {
    if (!stagingImages || stagingImages.length === 0) return false;
    
    console.log(`🚀 Starting image analysis for ${stagingImages.length} images in component ${componentName}`);
    
    onProcessingStateChange(componentId, true);
    setAnalysisInProgress(true);
    
    try {
      // Get reportId and roomId from the DOM
      const reportElement = document.querySelector('[data-report-id]');
      const roomElement = document.querySelector('[data-room-id]');
      
      if (!reportElement || !roomElement) {
        console.error("Could not find report-id or room-id in DOM");
        throw new Error("Report or room ID not found");
      }
      
      const reportId = reportElement.getAttribute('data-report-id');
      const roomId = roomElement.getAttribute('data-room-id');
      
      if (!reportId || !roomId) {
        console.error("Invalid report-id or room-id in DOM");
        throw new Error("Invalid report or room ID");
      }
      
      console.log(`📍 Processing images for report: ${reportId}, room: ${roomId}, component: ${componentId}`);
      
      // Step 1: Check storage availability
      console.log("🔍 Step 1: Checking storage availability...");
      const storageAvailable = await checkStorageBucket();
      
      if (!storageAvailable) {
        console.warn("⚠️ Storage bucket not available - proceeding with local URLs");
        // Don't throw error, just proceed with data URLs
      }
      
      // Step 2: Upload images to storage (if available)
      let finalImageUrls = stagingImages;
      if (storageAvailable) {
        console.log("📤 Step 2: Uploading images to storage...");
        try {
          const storedImageUrls = await uploadMultipleReportImages(stagingImages, reportId, roomId);
          
          // Verify upload success
          const successfulUploads = storedImageUrls.filter(url => !url.startsWith('data:')).length;
          const failedUploads = storedImageUrls.filter(url => url.startsWith('data:')).length;
          
          console.log(`📊 Upload verification: ${successfulUploads}/${stagingImages.length} images uploaded to storage`);
          
          if (successfulUploads > 0) {
            finalImageUrls = storedImageUrls;
            console.log("✅ Using storage URLs for processing");
          } else {
            console.warn("⚠️ All uploads failed, using original data URLs");
            finalImageUrls = stagingImages;
          }
        } catch (uploadError) {
          console.warn("⚠️ Storage upload failed, using original data URLs:", uploadError);
          finalImageUrls = stagingImages;
        }
      } else {
        console.log("⏭️ Step 2: Skipping storage upload (bucket unavailable)");
      }
      
      // Step 3: Save image records to database (only for successfully uploaded images)
      console.log("💾 Step 3: Saving image records to database...");
      const savedImages = [];
      const storageUrls = finalImageUrls.filter(url => !url.startsWith('data:'));
      
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
      
      // Step 4: Process images with AI
      console.log("🤖 Step 4: Processing images with AI...");
      const result = await processComponentImage(finalImageUrls, roomType, componentName, true);
      console.log("✅ AI processing completed:", result);
      
      // Step 5: Queue the update for ultra-fast batch saving
      console.log("⚡ Step 5: Queueing component update...");
      queueComponentUpdate(
        reportId,
        componentId,
        finalImageUrls,
        result.description || "",
        result.condition || { summary: "", points: [], rating: "fair" },
        result
      );
      
      // Step 6: Update UI immediately
      onImagesProcessed(componentId, finalImageUrls, result);
      
      const pendingCount = getPendingCount();
      const successfulStorageUploads = finalImageUrls.filter(url => !url.startsWith('data:')).length;
      
      console.log(`🎉 Processing complete: ${stagingImages.length} images analyzed, ${successfulStorageUploads} uploaded to storage, ${pendingCount} updates queued`);
      
      // Show appropriate success message
      const storageMessage = storageAvailable && successfulStorageUploads > 0 
        ? `uploaded ${successfulStorageUploads} to storage` 
        : "processed locally";
      
      toast({
        title: "Images processed successfully",
        description: `AI analyzed ${stagingImages.length} image(s) and ${storageMessage}. ${pendingCount} updates queued for saving.`,
      });
      
      return true;
    } catch (error) {
      console.error("❌ Error in image processing pipeline:", error);
      
      // Provide more specific error messages
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Report or room ID")) {
          errorMessage = "Could not identify the current report and room. Please refresh the page.";
        } else if (error.message.includes("Storage")) {
          errorMessage = "Storage service unavailable. Images processed locally.";
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
