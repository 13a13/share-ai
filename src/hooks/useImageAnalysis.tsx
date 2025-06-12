
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
      
      // Step 1: Check storage availability (now always returns true since bucket exists)
      console.log("🔍 Step 1: Checking storage availability...");
      const storageAvailable = await checkStorageBucket();
      
      if (!storageAvailable) {
        console.error("❌ Storage bucket not available - this should not happen after migration");
        throw new Error("Storage bucket 'inspection-images' is not available. Please contact support.");
      }
      
      console.log("✅ Storage bucket confirmed available");
      
      // Step 2: Upload images to storage
      console.log("📤 Step 2: Uploading images to storage...");
      const storedImageUrls = await uploadMultipleReportImages(stagingImages, reportId, roomId);
      
      // Verify upload success
      const successfulUploads = storedImageUrls.filter(url => !url.startsWith('data:')).length;
      const failedUploads = storedImageUrls.filter(url => url.startsWith('data:')).length;
      
      console.log(`📊 Upload verification: ${successfulUploads}/${stagingImages.length} images uploaded to storage`);
      
      if (successfulUploads === 0) {
        console.error("❌ All image uploads failed");
        throw new Error("Failed to upload any images to storage. Please try again.");
      }
      
      if (failedUploads > 0) {
        console.warn(`⚠️ ${failedUploads} images failed to upload, proceeding with ${successfulUploads} successful uploads`);
      }
      
      // Use only successfully uploaded images for processing
      const finalImageUrls = storedImageUrls;
      
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
      
      console.log(`🎉 Processing complete: ${stagingImages.length} images analyzed, ${successfulUploads} uploaded to storage, ${pendingCount} updates queued`);
      
      // Show success message
      toast({
        title: "Images processed successfully",
        description: `AI analyzed ${stagingImages.length} image(s) and uploaded ${successfulUploads} to storage. ${pendingCount} updates queued for saving.`,
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
          errorMessage = error.message;
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
