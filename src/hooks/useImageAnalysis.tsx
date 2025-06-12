
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
        console.error("❌ Storage bucket not available - cannot proceed");
        throw new Error("Storage bucket 'inspection-images' is not available");
      }
      
      // Step 2: Upload ALL images to storage BEFORE processing
      console.log("📤 Step 2: Uploading images to storage...");
      const storedImageUrls = await uploadMultipleReportImages(stagingImages, reportId, roomId);
      
      // Verify all images were uploaded successfully (no data URLs remaining)
      const dataUrlsRemaining = storedImageUrls.filter(url => url.startsWith('data:')).length;
      const successfulUploads = storedImageUrls.filter(url => !url.startsWith('data:')).length;
      
      console.log(`📊 Upload verification: ${successfulUploads}/${stagingImages.length} images uploaded to storage`);
      
      if (dataUrlsRemaining > 0) {
        console.warn(`⚠️ ${dataUrlsRemaining} images failed to upload to storage`);
      }
      
      if (successfulUploads === 0) {
        throw new Error("Failed to upload any images to storage");
      }
      
      // Step 3: Save image records to database with storage URLs
      console.log("💾 Step 3: Saving image records to database...");
      const savedImages = [];
      for (const imageUrl of storedImageUrls) {
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
      
      console.log(`📊 Database save results: ${savedImages.length}/${storedImageUrls.length} images saved`);
      
      // Step 4: Process images with AI using storage URLs
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
      
      console.log(`🎉 Processing complete: ${stagingImages.length} images uploaded and analyzed, ${pendingCount} updates queued`);
      
      toast({
        title: "Images processed and stored",
        description: `AI analyzed ${stagingImages.length} image(s) and uploaded ${successfulUploads} to storage. ${pendingCount} updates queued for saving.`,
      });
      
      return true;
    } catch (error) {
      console.error("❌ Error in image processing pipeline:", error);
      toast({
        title: "Error processing images",
        description: `Failed to process and store images: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
