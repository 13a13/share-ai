/**
 * ReportMapper - Handles transformation between database and client Report models
 * Consolidates logic from reportTransformers.ts and reportQueries.ts
 */

import { Report, Room } from '@/types';
import { parseReportInfo, formatRoomType } from '../reports/reportTransformers';

export class ReportMapper {
  /**
   * Transform database inspection to client Report format
   */
  static toClientModel(
    inspection: any,
    room: any,
    property: any,
    rooms: Room[] = []
  ): Report {
    // Map status to valid enum values
    let status: "draft" | "in_progress" | "pending_review" | "completed" | "archived" = "draft";
    if (inspection.status === "in_progress") status = "in_progress";
    else if (inspection.status === "pending_review") status = "pending_review";
    else if (inspection.status === "completed") status = "completed";
    else if (inspection.status === "archived") status = "archived";
    
    // Process report info data
    const reportInfoData = inspection.report_info ? 
      (typeof inspection.report_info === 'string' 
        ? JSON.parse(inspection.report_info) 
        : inspection.report_info)
      : {};
    
    // Extract proper room name or use a formatted version of the type
    const roomName = reportInfoData.roomName || 
                    (room.name && room.name !== 'check_in' && 
                     room.name !== 'check_out' && 
                     room.name !== 'general' ? 
                      room.name : 
                      formatRoomType(room.type));

    // Get report type from report_info or fallback to "inspection"
    const reportType = reportInfoData.reportType || "inspection";
    
    return {
      id: inspection.id,
      name: inspection.status || '',
      propertyId: room?.property_id || '',
      property: property,
      type: reportType as any,
      status: status,
      reportInfo: { 
        reportDate: new Date().toISOString(),
        additionalInfo: inspection.report_url || '',
        ...(reportInfoData as Partial<Report['reportInfo']>)
      },
      rooms: rooms,
      createdAt: new Date(inspection.created_at),
      updatedAt: new Date(inspection.updated_at),
      completedAt: null,
      disclaimers: []
    };
  }

  /**
   * Transform client Report to database insert format
   */
  static toDatabaseInsert(propertyId: string, type: string, roomId: string) {
    const reportInfo = {
      reportDate: new Date().toISOString(),
      clerk: 'Inspector',
      sections: [],
      components: [],
      reportType: type
    };
    
    return {
      id: crypto.randomUUID(),
      room_id: roomId,
      status: 'draft',
      report_info: reportInfo
    };
  }

  /**
   * Transform client Report updates to database format
   */
  static toDatabaseUpdate(updates: Partial<Report>) {
    const dbUpdates: any = {};
    
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status;
    }
    
    if (updates.reportInfo !== undefined) {
      dbUpdates.report_info = updates.reportInfo;
    }
    
    if (updates.name !== undefined) {
      // Name is mapped to status in current schema
      dbUpdates.status = updates.name || 'draft';
    }
    
    dbUpdates.updated_at = new Date().toISOString();
    
    return dbUpdates;
  }
}
