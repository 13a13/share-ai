
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { BatchReportsAPI } from "@/lib/api/reports/batchOperationsApi";
import { ReportsAPI } from "@/lib/api";
import { Report, Room } from "@/types";
import { useReportCache } from "./useReportCache";

interface SaveProgress {
  total: number;
  completed: number;
  currentOperation: string;
}

/**
 * Optimized report saving with parallel processing and progress tracking
 */
export const useOptimizedReportSaving = () => {
  const { toast } = useToast();
  const { updateCachedReport, invalidateCache } = useReportCache();
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);

  const saveReportOptimized = useCallback(async (
    report: Report,
    updateStatus: boolean = true
  ): Promise<boolean> => {
    if (!report || isSaving) return false;

    setIsSaving(true);
    setSaveProgress({ total: 100, completed: 0, currentOperation: "Preparing save..." });

    try {
      console.log("Starting optimized report save for:", report.id);

      // Step 1: Prepare batch data (10%)
      setSaveProgress({ total: 100, completed: 10, currentOperation: "Preparing room data..." });

      const roomUpdates = report.rooms.map(room => ({
        roomId: room.id,
        roomData: {
          name: room.name,
          type: room.type,
          generalCondition: room.generalCondition,
          components: room.components || [],
          images: room.images || [],
          sections: room.sections || []
        }
      }));

      // Step 2: Save all rooms in parallel batches (60%)
      setSaveProgress({ total: 100, completed: 20, currentOperation: "Saving room data..." });

      const BATCH_SIZE = 3; // Process 3 rooms at a time to avoid overwhelming the API
      const roomBatches = [];
      
      for (let i = 0; i < roomUpdates.length; i += BATCH_SIZE) {
        roomBatches.push(roomUpdates.slice(i, i + BATCH_SIZE));
      }

      let completedRooms = 0;
      const totalRooms = roomUpdates.length;

      for (const batch of roomBatches) {
        const batchPromises = batch.map(async ({ roomId, roomData }) => {
          try {
            const result = await ReportsAPI.updateRoom(report.id, roomId, roomData);
            completedRooms++;
            
            // Update progress
            const progress = 20 + Math.round((completedRooms / totalRooms) * 60);
            setSaveProgress({ 
              total: 100, 
              completed: progress, 
              currentOperation: `Saved ${completedRooms}/${totalRooms} rooms...` 
            });
            
            return result;
          } catch (error) {
            console.error(`Failed to save room ${roomId}:`, error);
            throw error;
          }
        });

        // Wait for current batch to complete before moving to next
        await Promise.all(batchPromises);
      }

      // Step 3: Update report status if needed (20%)
      setSaveProgress({ total: 100, completed: 80, currentOperation: "Updating report status..." });

      if (updateStatus) {
        let updatedStatus = report.status;
        
        if (updatedStatus === "draft") {
          updatedStatus = "in_progress";
        }
        
        const hasRoomsWithImages = report.rooms.some(room => 
          room.images.length > 0 || (room.components && room.components.some(comp => comp.images.length > 0))
        );
        
        if (hasRoomsWithImages && updatedStatus === "in_progress") {
          updatedStatus = "pending_review";
        }

        const updatedReport = await ReportsAPI.update(report.id, {
          status: updatedStatus,
          updatedAt: new Date()
        });

        if (updatedReport) {
          // Update cache with new report data
          const completeReport = {
            ...updatedReport,
            rooms: report.rooms
          };
          updateCachedReport(report.id, completeReport);
        }
      }

      // Step 4: Finalize (100%)
      setSaveProgress({ total: 100, completed: 100, currentOperation: "Save completed!" });

      console.log(`Successfully saved report with ${totalRooms} rooms`);
      
      toast({
        title: "Report Saved",
        description: `Successfully saved report with ${totalRooms} room(s)`,
      });

      // Clear progress after a short delay
      setTimeout(() => setSaveProgress(null), 1000);

      return true;

    } catch (error) {
      console.error("Error in optimized report save:", error);
      
      // Invalidate cache to ensure fresh data on next load
      invalidateCache(report.id);
      
      toast({
        title: "Save Failed",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
      
      setSaveProgress(null);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast, updateCachedReport, invalidateCache, isSaving]);

  const completeReportOptimized = useCallback(async (report: Report): Promise<boolean> => {
    if (!report || isSaving) return false;

    setIsSaving(true);
    setSaveProgress({ total: 100, completed: 0, currentOperation: "Completing report..." });

    try {
      // First save all rooms
      const saveSuccess = await saveReportOptimized(report, false);
      if (!saveSuccess) return false;

      setSaveProgress({ total: 100, completed: 80, currentOperation: "Marking as completed..." });

      // Then mark as completed
      const updatedReport = await ReportsAPI.update(report.id, {
        status: "completed",
        completedAt: new Date(),
      });

      if (updatedReport) {
        const completeReport = {
          ...updatedReport,
          rooms: report.rooms
        };
        updateCachedReport(report.id, completeReport);

        setSaveProgress({ total: 100, completed: 100, currentOperation: "Report completed!" });
        
        toast({
          title: "Report Completed",
          description: "Your report has been marked as completed.",
        });

        setTimeout(() => setSaveProgress(null), 1000);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error completing report:", error);
      toast({
        title: "Error",
        description: "Failed to complete report. Please try again.",
        variant: "destructive",
      });
      setSaveProgress(null);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [saveReportOptimized, updateCachedReport, toast, isSaving]);

  return {
    saveReportOptimized,
    completeReportOptimized,
    isSaving,
    saveProgress
  };
};
