
import { Report } from '@/types';

/**
 * Transform inspection data to client Report format
 */
export const transformInspectionToReport = (
  inspection: Record<string, any>, 
  room: Record<string, any>, 
  property: any
): Report => {
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
      : inspection.report_info) as Record<string, any>
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
    type: reportType as any, // Use the stored report type
    status: status,
    reportInfo: { 
      reportDate: new Date().toISOString(), // Use ISO string format
      additionalInfo: inspection.report_url || '',
      ...(reportInfoData as Partial<Report['reportInfo']>)
    },
    rooms: [], // Rooms will be loaded on demand for individual reports
    createdAt: new Date(inspection.created_at),
    updatedAt: new Date(inspection.updated_at),
    completedAt: null,
    disclaimers: []
  };
};

/**
 * Convert report info data from string to object
 */
export const parseReportInfo = (reportInfo: any): Record<string, any> => {
  if (!reportInfo) return {};
  
  if (typeof reportInfo === 'string') {
    try {
      return JSON.parse(reportInfo);
    } catch (e) {
      console.error("Error parsing report info:", e);
      return {};
    }
  }
  
  return reportInfo as Record<string, any>;
};

/**
 * Format a room type string to be more readable
 * e.g. 'living_room' -> 'Living Room'
 */
export const formatRoomType = (type: string): string => {
  if (!type) return 'Room';
  
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};
