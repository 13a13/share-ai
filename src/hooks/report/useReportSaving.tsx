
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Report } from "@/types";
import { useReportCache } from "../useReportCache";
import { ReportSaveOperations } from "./reportSaveOperations";

interface SaveProgress {
  total: number;
  completed: number;
  currentOperation: string;
}

/**
 * Simplified report saving hook with focused responsibilities
 */
export const useReportSaving = () => {
  const { toast } = useToast();
  const { updateCachedReport, invalidateCache } = useReportCache();
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);
  const saveInProgressRef = useRef(false);

  const saveReport = useCallback(async (
    report: Report,
    options: { updateStatus?: boolean; markCompleted?: boolean } = {}
  ): Promise<boolean> => {
    if (!report || saveInProgressRef.current) return false;

    saveInProgressRef.current = true;
    setIsSaving(true);
    setSaveProgress({ total: 100, completed: 0, currentOperation: "Starting save..." });

    try {
      console.log("🚀 Starting optimized save for report:", report.id);
      const startTime = performance.now();

      // Use the operations service for the actual saving
      const success = await ReportSaveOperations.saveReport(
        report,
        options,
        (progress) => setSaveProgress(progress)
      );

      if (success) {
        // Update cache
        updateCachedReport(report.id, {
          ...report,
          status: options.markCompleted ? "completed" : report.status,
          updatedAt: new Date()
        });

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        toast({
          title: options.markCompleted ? "Report Completed" : "Report Saved",
          description: `Operation completed in ${duration}ms`,
        });

        setTimeout(() => setSaveProgress(null), 800);
        return true;
      }

      throw new Error("Save operation failed");

    } catch (error) {
      console.error("❌ Save failed:", error);
      
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
      saveInProgressRef.current = false;
    }
  }, [toast, updateCachedReport, invalidateCache]);

  return {
    saveReport,
    isSaving,
    saveProgress
  };
};
