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
 * Convert report info data from string to object - ENHANCED VERSION
 */
export const parseReportInfo = (reportInfo: any) => {
  console.log("📊 parseReportInfo called with:", typeof reportInfo, reportInfo ? Object.keys(reportInfo).length : 0);
  
  if (!reportInfo || typeof reportInfo !== 'object') {
    console.log("⚠️ Invalid reportInfo, returning defaults");
    return {
      roomName: '',
      generalCondition: '',
      components: [], // ✅ Always ensure array
      sections: [],
      additionalRooms: [],
      clerk: '',
      inventoryType: '',
      tenantPresent: false,
      tenantName: '',
      additionalInfo: '',
      fileUrl: ''
    };
  }
  
  const parsed = {
    roomName: reportInfo.roomName || '',
    generalCondition: reportInfo.generalCondition || '',
    components: Array.isArray(reportInfo.components) ? reportInfo.components : [], // ✅ ENHANCED: Always ensure array
    sections: Array.isArray(reportInfo.sections) ? reportInfo.sections : [],
    additionalRooms: Array.isArray(reportInfo.additionalRooms) ? reportInfo.additionalRooms : [],
    clerk: reportInfo.clerk || '',
    inventoryType: reportInfo.inventoryType || '',
    tenantPresent: Boolean(reportInfo.tenantPresent),
    tenantName: reportInfo.tenantName || '',
    additionalInfo: reportInfo.additionalInfo || '',
    fileUrl: reportInfo.fileUrl || ''
  };
  
  // ✅ ENHANCED: Ensure all additionalRooms have component arrays
  if (parsed.additionalRooms.length > 0) {
    parsed.additionalRooms = parsed.additionalRooms.map((room: any) => ({
      ...room,
      components: Array.isArray(room.components) ? room.components : [],
      sections: Array.isArray(room.sections) ? room.sections : []
    }));
  }
  
  console.log("✅ parseReportInfo result:", {
    mainComponents: parsed.components.length,
    additionalRooms: parsed.additionalRooms.length,
    additionalRoomComponents: parsed.additionalRooms.map((room: any) => room.components?.length || 0)
  });
  
  return parsed;
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
