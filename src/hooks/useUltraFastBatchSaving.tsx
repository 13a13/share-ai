import { useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PendingUpdate {
  componentId: string;
  images: string[];
  description: string;
  condition: any;
  analysisData: any;
}

/**
 * Ultra-fast batch saving with immediate deduplication and optimized queuing
 */
export const useUltraFastBatchSaving = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout>();
  const saveInProgressRef = useRef(false);

  const ultraFastSave = useCallback(async (reportId: string) => {
    if (pendingUpdatesRef.current.size === 0 || saveInProgressRef.current) return true;

    saveInProgressRef.current = true;
    setIsSaving(true);
    
    try {
      const updates = Array.from(pendingUpdatesRef.current.values());
      console.log(`🚀 Ultra-fast batch saving ${updates.length} component updates`);
      
      const startTime = performance.now();

      // Get current inspection data once
      const { data: inspection, error: fetchError } = await supabase
        .from('inspections')
        .select('report_info')
        .eq('id', reportId)
        .single();

      if (fetchError) throw fetchError;

      // Parse report info
      let reportInfo: any = {};
      try {
        if (inspection?.report_info) {
          reportInfo = typeof inspection.report_info === 'string' 
            ? JSON.parse(inspection.report_info) 
            : inspection.report_info;
        }
      } catch (e) {
        console.error('Error parsing report_info:', e);
        reportInfo = {};
      }

      // Apply all updates in memory
      updates.forEach(update => {
        updateComponentInReportInfo(reportInfo, update);
      });

      // Single atomic database update
      const { error: updateError } = await supabase
        .from('inspections')
        .update({ 
          report_info: reportInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      const endTime = performance.now();
      console.log(`✅ Ultra-fast batch save completed in ${Math.round(endTime - startTime)}ms`);

      toast({
        title: "Components Saved",
        description: `Ultra-fast saved ${updates.length} components in ${Math.round(endTime - startTime)}ms`,
      });
      
      // Clear pending updates after successful save
      pendingUpdatesRef.current.clear();
      return true;

    } catch (error) {
      console.error("❌ Ultra-fast batch save failed:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save component updates. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
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
    // Immediate deduplication - only keep latest update for each component
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

    // Ultra-short debounce for immediate responsiveness
    timeoutRef.current = setTimeout(() => {
      ultraFastSave(reportId);
    }, 500); // Reduced from 1000ms to 500ms

  }, [ultraFastSave]);

  const forceSave = useCallback(async (reportId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return await ultraFastSave(reportId);
  }, [ultraFastSave]);

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

// Helper function to update component data in report info structure
function updateComponentInReportInfo(reportInfo: any, update: PendingUpdate) {
  // Update in main room components
  if (Array.isArray(reportInfo.components)) {
    const componentIndex = reportInfo.components.findIndex((c: any) => c.id === update.componentId);
    if (componentIndex >= 0) {
      reportInfo.components[componentIndex] = {
        ...reportInfo.components[componentIndex],
        description: update.description,
        condition: update.condition,
        images: update.images.map((url: string) => ({
          id: crypto.randomUUID(),
          url,
          timestamp: new Date(),
          aiProcessed: true,
          aiData: update.analysisData
        }))
      };
      return;
    }
  }

  // Update in additional rooms
  if (Array.isArray(reportInfo.additionalRooms)) {
    for (const room of reportInfo.additionalRooms) {
      if (Array.isArray(room.components)) {
        const componentIndex = room.components.findIndex((c: any) => c.id === update.componentId);
        if (componentIndex >= 0) {
          room.components[componentIndex] = {
            ...room.components[componentIndex],
            description: update.description,
            condition: update.condition,
            images: update.images.map((url: string) => ({
              id: crypto.randomUUID(),
              url,
              timestamp: new Date(),
              aiProcessed: true,
              aiData: update.analysisData
            }))
          };
          return;
        }
      }
    }
  }
}
