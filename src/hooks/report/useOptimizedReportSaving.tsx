
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Report } from "@/types";
import { useReportCache } from "../useReportCache";
import { OptimizedSaveOperations } from "@/lib/api/reports/optimizedSaveOperations";
import { ReportStatusUpdater } from "@/lib/api/reports/reportStatusUpdater";
import { ReportSaveProgress, SaveProgress } from "@/utils/reportSaveProgress";

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
    setSaveProgress(ReportSaveProgress.createInitialProgress());

    try {
      console.log("Starting optimized report save for:", report.id);

      // Step 1: Prepare batch data (10%)
      setSaveProgress(ReportSaveProgress.createPreparationProgress());

      const roomUpdates = OptimizedSaveOperations.prepareRoomUpdates(report);

      // Step 2: Save all rooms in parallel batches (60%)
      setSaveProgress(ReportSaveProgress.createRoomSavingProgress());

      const roomSaveSuccess = await OptimizedSaveOperations.saveRoomsBatch(
        report.id,
        roomUpdates,
        (completed, total, operation) => {
          setSaveProgress(ReportSaveProgress.createRoomProgress(completed, total, operation));
        }
      );

      if (!roomSaveSuccess) {
        throw new Error("Failed to save rooms");
      }

      // Step 3: Update report status if needed (20%)
      setSaveProgress(ReportSaveProgress.createStatusUpdateProgress());

      const updatedReport = await ReportStatusUpdater.updateReportStatus(report, updateStatus);

      if (updatedReport) {
        // Update cache with new report data
        const completeReport = {
          ...updatedReport,
          rooms: report.rooms
        };
        updateCachedReport(report.id, completeReport);
      }

      // Step 4: Finalize (100%)
      setSaveProgress(ReportSaveProgress.createCompletionProgress());

      console.log(`Successfully saved report with ${roomUpdates.length} rooms`);
      
      toast({
        title: "Report Saved",
        description: `Successfully saved report with ${roomUpdates.length} room(s)`,
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
    setSaveProgress(ReportSaveProgress.createInitialProgress());

    try {
      // First save all rooms
      const saveSuccess = await saveReportOptimized(report, false);
      if (!saveSuccess) return false;

      setSaveProgress(ReportSaveProgress.createMarkingCompletedProgress());

      // Then mark as completed
      const updatedReport = await ReportStatusUpdater.completeReport(report.id);

      if (updatedReport) {
        const completeReport = {
          ...updatedReport,
          rooms: report.rooms
        };
        updateCachedReport(report.id, completeReport);

        setSaveProgress(ReportSaveProgress.createReportCompletionProgress());
        
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
