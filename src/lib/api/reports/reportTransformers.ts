
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

  return {
    id: inspection.id,
    name: inspection.status || '',
    propertyId: room?.property_id || '',
    property: property,
    type: 'inspection',
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
