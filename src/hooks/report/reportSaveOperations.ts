
import { supabase } from "@/integrations/supabase/client";
import { Report } from "@/types";

interface SaveProgress {
  total: number;
  completed: number;
  currentOperation: string;
}

interface SaveOptions {
  updateStatus?: boolean;
  markCompleted?: boolean;
}

/**
 * Core operations for saving reports to the database
 */
export class ReportSaveOperations {
  /**
   * Main save operation that handles all report saving logic
   */
  static async saveReport(
    report: Report,
    options: SaveOptions = {},
    onProgress?: (progress: SaveProgress) => void
  ): Promise<boolean> {
    try {
      // Step 1: Prepare data (30%)
      onProgress?.({ total: 100, completed: 30, currentOperation: "Preparing data..." });
      
      const reportUpdateData = this.prepareReportUpdate(report, options);
      const roomsData = this.prepareRoomsData(report);

      // Step 2: Execute database operations (70%)
      onProgress?.({ total: 100, completed: 70, currentOperation: "Saving to database..." });
      
      const success = await this.executeAtomicSave(
        report.id,
        reportUpdateData,
        roomsData
      );

      if (success) {
        onProgress?.({ total: 100, completed: 100, currentOperation: "Save completed!" });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Save operation failed:", error);
      return false;
    }
  }

  /**
   * Prepare report update data
   */
  private static prepareReportUpdate(report: Report, options: SaveOptions) {
    let status = report.status;
    
    if (options.markCompleted) {
      status = "completed";
    } else if (options.updateStatus && status === "draft") {
      status = "in_progress";
      
      // Check if report has images and should be pending review
      const hasImages = report.rooms.some(room => 
        room.images.length > 0 || 
        (room.components && room.components.some(comp => comp.images.length > 0))
      );
      
      if (hasImages) {
        status = "pending_review";
      }
    }

    return {
      status,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Prepare rooms data for saving
   */
  private static prepareRoomsData(report: Report) {
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

  /**
   * Execute atomic save operation
   */
  private static async executeAtomicSave(
    reportId: string,
    reportUpdateData: any,
    roomsData: any[]
  ): Promise<boolean> {
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
      console.error('Atomic save failed:', error);
      return false;
    }
  }
}
