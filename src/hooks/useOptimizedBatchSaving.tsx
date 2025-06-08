
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { BatchReportsAPI } from "@/lib/api/reports/batchOperationsApi";
import { RoomComponent } from "@/types";

interface PendingUpdate {
  componentId: string;
  images: string[];
  description: string;
  condition: any;
  analysisData: any;
}

/**
 * Optimized batch saving with debouncing and queueing
 */
export const useOptimizedBatchSaving = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSave = useCallback(async (reportId: string) => {
    if (pendingUpdatesRef.current.size === 0) return;

    setIsSaving(true);
    
    try {
      const updates = Array.from(pendingUpdatesRef.current.values());
      console.log(`Saving batch of ${updates.length} component updates`);

      const success = await BatchReportsAPI.updateReportBatch(reportId, {
        components: updates
      });

      if (success) {
        toast({
          title: "Analysis Saved",
          description: `Successfully saved ${updates.length} component update(s)`,
        });
        
        // Clear pending updates after successful save
        pendingUpdatesRef.current.clear();
        return true;
      } else {
        throw new Error("Batch save failed");
      }
    } catch (error) {
      console.error("Error in batch save:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save component updates. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  const queueComponentUpdate = useCallback((
    reportId: string,
    componentId: string,
    images: string[],
    description: string,
    condition: any,
    analysisData: any
  ) => {
    // Add/update pending update
    pendingUpdatesRef.current.set(componentId, {
      componentId,
      images,
      description,
      condition,
      analysisData
    });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      debouncedSave(reportId);
    }, 1000); // 1 second debounce

  }, [debouncedSave]);

  const forceSave = useCallback(async (reportId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return await debouncedSave(reportId);
  }, [debouncedSave]);

  const getPendingCount = useCallback(() => {
    return pendingUpdatesRef.current.size;
  }, []);

  return {
    queueComponentUpdate,
    forceSave,
    isSaving,
    getPendingCount
  };
};
