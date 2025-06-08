
import { ReportsAPI } from "@/lib/api";
import { Report } from "@/types";
import { OptimizedSaveOperations } from "./optimizedSaveOperations";

/**
 * Handles report status updates with business logic
 */
export class ReportStatusUpdater {
  /**
   * Update report status based on current state and images
   */
  static async updateReportStatus(
    report: Report, 
    updateStatus: boolean = true
  ): Promise<Report | null> {
    if (!updateStatus) return null;

    let updatedStatus = report.status;
    
    if (updatedStatus === "draft") {
      updatedStatus = "in_progress";
    }
    
    const hasRoomsWithImages = OptimizedSaveOperations.hasRoomsWithImages(report);
    
    if (hasRoomsWithImages && updatedStatus === "in_progress") {
      updatedStatus = "pending_review";
    }

    try {
      const updatedReport = await ReportsAPI.update(report.id, {
        status: updatedStatus,
        updatedAt: new Date()
      });

      return updatedReport;
    } catch (error) {
      console.error("Error updating report status:", error);
      throw error;
    }
  }

  /**
   * Complete a report by setting status to completed
   */
  static async completeReport(reportId: string): Promise<Report | null> {
    try {
      const updatedReport = await ReportsAPI.update(reportId, {
        status: "completed",
        completedAt: new Date(),
      });

      return updatedReport;
    } catch (error) {
      console.error("Error completing report:", error);
      throw error;
    }
  }
}
