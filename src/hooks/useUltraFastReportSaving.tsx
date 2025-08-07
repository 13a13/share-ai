
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Report } from "@/types";
import { useReportCache } from "./useReportCache";

interface OptimizedSaveProgress {
  total: number;
  completed: number;
  currentOperation: string;
}

/**
 * Ultra-fast report saving with true parallelization and minimal database operations
 */
export const useUltraFastReportSaving = () => {
  const { toast } = useToast();
  const { updateCachedReport, invalidateCache } = useReportCache();
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<OptimizedSaveProgress | null>(null);
  const saveInProgressRef = useRef(false);

  const ultraFastSave = useCallback(async (
    report: Report,
    updateStatus: boolean = true
  ): Promise<boolean> => {
    if (!report || saveInProgressRef.current) return false;

    saveInProgressRef.current = true;
    setIsSaving(true);
    setSaveProgress({ total: 100, completed: 0, currentOperation: "Starting optimized save..." });

    try {
      console.log("🚀 Starting ultra-fast save for report:", report.id);
      const startTime = performance.now();

      // Step 1: Prepare all data in parallel (20%)
      setSaveProgress({ total: 100, completed: 10, currentOperation: "Preparing data structures..." });

      const reportUpdatePromise = prepareReportUpdate(report, updateStatus);
      const roomsDataPromise = prepareAllRoomsData(report);
      
      const [reportUpdateData, allRoomsData] = await Promise.all([
        reportUpdatePromise,
        roomsDataPromise
      ]);

      setSaveProgress({ total: 100, completed: 30, currentOperation: "Executing batch operations..." });

      // Step 2: Execute all database operations in a single transaction (60%)
      const success = await executeSingleTransactionSave(
        report.id,
        reportUpdateData,
        allRoomsData
      );

      if (!success) {
        throw new Error("Transaction failed");
      }

      setSaveProgress({ total: 100, completed: 90, currentOperation: "Updating cache..." });

      // Step 3: Update cache immediately without refetching (10%)
      updateCachedReport(report.id, {
        ...report,
        status: reportUpdateData.status,
        updatedAt: new Date()
      });

      const endTime = performance.now();
      console.log(`✅ Ultra-fast save completed in ${Math.round(endTime - startTime)}ms`);

      setSaveProgress({ total: 100, completed: 100, currentOperation: "Save completed!" });

      toast({
        title: "Report Saved",
        description: `Ultra-fast save completed in ${Math.round(endTime - startTime)}ms`,
      });

      // Clear progress after short delay
      setTimeout(() => setSaveProgress(null), 800);

      return true;

    } catch (error) {
      console.error("❌ Ultra-fast save failed:", error);
      
      invalidateCache(report.id);
      
      toast({
        title: "Save Failed",
        description: "Ultra-fast save failed. Please try again.",
        variant: "destructive",
      });
      
      setSaveProgress(null);
      return false;
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  }, [toast, updateCachedReport, invalidateCache]);

  const ultraFastComplete = useCallback(async (report: Report): Promise<boolean> => {
    if (!report || saveInProgressRef.current) return false;

    saveInProgressRef.current = true;
    setIsSaving(true);
    setSaveProgress({ total: 100, completed: 0, currentOperation: "Completing report..." });

    try {
      // First save everything
      const saveSuccess = await ultraFastSave(report, false);
      if (!saveSuccess) return false;

      setSaveProgress({ total: 100, completed: 80, currentOperation: "Marking as completed..." });

      // Then mark as completed in a single operation
      const { error } = await supabase
        .from('inspections')
        .update({
          status: "completed",
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id);

      if (error) throw error;

      updateCachedReport(report.id, {
        ...report,
        status: "completed",
        updatedAt: new Date()
      });

      setSaveProgress({ total: 100, completed: 100, currentOperation: "Report completed!" });
      
      toast({
        title: "Report Completed",
        description: "Your report has been completed successfully.",
      });

      setTimeout(() => setSaveProgress(null), 800);
      return true;

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
      saveInProgressRef.current = false;
    }
  }, [ultraFastSave, updateCachedReport, toast]);

  return {
    ultraFastSave,
    ultraFastComplete,
    isSaving,
    saveProgress
  };
};

// Helper functions for optimized data preparation
async function prepareReportUpdate(report: Report, updateStatus: boolean) {
  let status = report.status;
  
  if (updateStatus) {
    if (status === "draft") {
      status = "in_progress";
    }
    
    const hasImages = report.rooms.some(room => 
      room.images.length > 0 || 
      (room.components && room.components.some(comp => comp.images.length > 0))
    );
    
    if (hasImages && status === "in_progress") {
      status = "pending_review";
    }
  }

  return {
    status,
    updated_at: new Date().toISOString()
  };
}

async function prepareAllRoomsData(report: Report) {
  return report.rooms.map(room => ({
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
}

async function executeSingleTransactionSave(
  reportId: string,
  reportUpdateData: any,
  roomsData: any[]
) {
  try {
    // Get current inspection data
    const { data: inspection, error: fetchError } = await supabase
      .from('inspections')
      .select('room_id, report_info')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;

    // Prepare report_info update
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

    // Update main room and additional rooms
    const mainRoomId = inspection.room_id;
    const mainRoom = roomsData.find(r => r.roomId === mainRoomId);
    const additionalRooms = roomsData.filter(r => r.roomId !== mainRoomId);

    if (mainRoom) {
      reportInfo.roomName = mainRoom.roomData.name;
      reportInfo.generalCondition = mainRoom.roomData.generalCondition;
      reportInfo.components = mainRoom.roomData.components;
      reportInfo.sections = mainRoom.roomData.sections;
    }

    reportInfo.additionalRooms = additionalRooms.map(room => ({
      id: room.roomId,
      ...room.roomData
    }));

    // Single atomic update
    const { error: updateError } = await supabase
      .from('inspections')
      .update({
        ...reportUpdateData,
        report_info: reportInfo
      })
      .eq('id', reportId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Transaction failed:', error);
    return false;
  }
}
