
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
      
      // Step 1: Upload images to storage BEFORE AI processing
      console.log("📤 Step 1: Uploading images to storage...");
      const storageAvailable = await checkStorageBucket();
      let storedImageUrls: string[] = stagingImages;
      
      if (storageAvailable) {
        try {
          // Upload all images to Supabase Storage in parallel
          storedImageUrls = await uploadMultipleReportImages(stagingImages, reportId, roomId);
          console.log("✅ Images successfully uploaded to storage:", storedImageUrls.length);
          
          // Verify uploads by checking if URLs changed from data URLs
          const uploadedCount = storedImageUrls.filter(url => !url.startsWith('data:')).length;
          console.log(`📊 Upload verification: ${uploadedCount}/${stagingImages.length} images uploaded to storage`);
          
        } catch (storageError) {
          console.error("❌ Storage upload failed:", storageError);
          toast({
            title: "Storage upload failed",
            description: "Images will be processed locally. Please check your connection.",
            variant: "destructive",
          });
          storedImageUrls = stagingImages;
        }
      } else {
        console.warn("⚠️ Storage bucket not available, using original image URLs");
        toast({
          title: "Storage unavailable",
          description: "Images will be processed locally.",
          variant: "destructive",
        });
      }
      
      // Step 2: Save images to database inspection_images table
      console.log("💾 Step 2: Saving images to database...");
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
      
      // Step 3: Process stored images with AI
      console.log("🤖 Step 3: Processing images with AI...");
      const result = await processComponentImage(storedImageUrls, roomType, componentName, true);
      console.log("✅ AI processing completed:", result);
      
      // Step 4: Queue the update for ultra-fast batch saving
      console.log("⚡ Step 4: Queueing component update...");
      queueComponentUpdate(
        reportId,
        componentId,
        storedImageUrls,
        result.description || "",
        result.condition || { summary: "", points: [], rating: "fair" },
        result
      );
      
      // Step 5: Update UI immediately
      onImagesProcessed(componentId, storedImageUrls, result);
      
      const pendingCount = getPendingCount();
      const storageStatus = storageAvailable && storedImageUrls.some(url => !url.startsWith('data:')) ? 
        "uploaded to storage" : "processed locally";
      
      console.log(`🎉 Processing complete: ${stagingImages.length} images ${storageStatus}, ${pendingCount} updates queued`);
      
      toast({
        title: "Images processed successfully",
        description: `AI analyzed ${stagingImages.length} image(s) and ${storageStatus}. ${pendingCount} updates queued for saving.`,
      });
      
      return true;
    } catch (error) {
      console.error("❌ Error in image processing pipeline:", error);
      toast({
        title: "Error processing images",
        description: "AI analysis failed. Please try again or check your internet connection.",
        variant: "destructive",
      });
      
      // Fallback: still try to save the images without AI analysis
      try {
        console.log("🔄 Attempting fallback image save...");
        const reportElement = document.querySelector('[data-report-id]');
        const roomElement = document.querySelector('[data-room-id]');
        
        if (reportElement && roomElement) {
          const reportId = reportElement.getAttribute('data-report-id');
          const roomId = roomElement.getAttribute('data-room-id');
          
          if (reportId && roomId) {
            const storageAvailable = await checkStorageBucket();
            let storedImageUrls = stagingImages;
            
            if (storageAvailable) {
              try {
                storedImageUrls = await uploadMultipleReportImages(stagingImages, reportId, roomId);
                console.log("✅ Fallback storage upload successful");
              } catch (storageError) {
                console.warn("⚠️ Fallback storage upload failed:", storageError);
              }
            }
            
            // Save to database even without AI analysis
            for (const imageUrl of storedImageUrls) {
              try {
                await RoomImageAPI.addImageToRoom(reportId, roomId, imageUrl);
              } catch (dbError) {
                console.error("❌ Fallback database save failed:", dbError);
              }
            }
            
            onImagesProcessed(componentId, storedImageUrls, {
              description: "",
              condition: {
                summary: "",
                points: [],
                rating: "fair"
              },
              cleanliness: "domestic_clean",
              notes: "AI analysis failed - please add description manually"
            });
            
            console.log("✅ Fallback processing completed");
          }
        }
      } catch (uploadError) {
        console.error("❌ Fallback processing also failed:", uploadError);
      }
      
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
