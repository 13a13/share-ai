
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Report } from "@/types";
import { useReportCache } from "./useReportCache";

interface CompletionProgress {
  total: number;
  completed: number;
  currentOperation: string;
}

/**
 * Ultra-fast report completion with minimal database operations
 */
export const useUltraFastCompletion = () => {
  const { toast } = useToast();
  const { updateCachedReport } = useReportCache();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState<CompletionProgress | null>(null);

  const completeReportInstantly = useCallback(async (report: Report): Promise<boolean> => {
    if (!report) return false;

    setIsCompleting(true);
    setCompletionProgress({ total: 100, completed: 0, currentOperation: "Starting completion..." });

    try {
      console.log("🚀 Ultra-fast completion for report:", report.id);
      const startTime = performance.now();

      // Step 1: Batch prepare all room data (20%)
      setCompletionProgress({ total: 100, completed: 20, currentOperation: "Preparing room data..." });
      
      const roomsData = await Promise.all(
        report.rooms.map(async (room) => ({
          roomId: room.id,
          components: room.components || [],
          generalCondition: room.generalCondition,
          images: room.images || []
        }))
      );

      // Step 2: Single atomic database operation (60%)
      setCompletionProgress({ total: 100, completed: 60, currentOperation: "Completing report..." });

      const { data: inspection, error: fetchError } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', report.id)
        .single();

      if (fetchError) throw fetchError;

      // Prepare complete report info
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
        reportInfo.generalCondition = mainRoom.generalCondition;
        reportInfo.components = mainRoom.components;
      }

      reportInfo.additionalRooms = additionalRooms.map(room => ({
        id: room.roomId,
        generalCondition: room.generalCondition,
        components: room.components,
        images: room.images
      }));

      // Single atomic completion update
      const completionTime = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          status: "completed",
          updated_at: completionTime,
          report_info: reportInfo
        })
        .eq('id', report.id);

      if (updateError) throw updateError;

      // Step 3: Update cache instantly (20%)
      setCompletionProgress({ total: 100, completed: 100, currentOperation: "Updating cache..." });

      updateCachedReport(report.id, {
        ...report,
        status: "completed",
        updatedAt: new Date(completionTime)
      });

      const endTime = performance.now();
      console.log(`✅ Ultra-fast completion in ${Math.round(endTime - startTime)}ms`);

      toast({
        title: "Report Completed",
        description: `Ultra-fast completion in ${Math.round(endTime - startTime)}ms`,
      });

      setTimeout(() => setCompletionProgress(null), 500);
      return true;

    } catch (error) {
      console.error("❌ Ultra-fast completion failed:", error);
      
      toast({
        title: "Completion Failed",
        description: "Failed to complete report. Please try again.",
        variant: "destructive",
      });
      
      setCompletionProgress(null);
      return false;
    } finally {
      setIsCompleting(false);
    }
  }, [toast, updateCachedReport]);

  return {
    completeReportInstantly,
    isCompleting,
    completionProgress
  };
};
