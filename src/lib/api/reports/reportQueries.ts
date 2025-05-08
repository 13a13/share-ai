
import { Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { transformInspectionToReport } from './reportTransformers';
import { 
  processMainRoom, 
  processAdditionalRooms, 
  getRoomById, 
  getPropertyById, 
  getRoomsByPropertyId,
  getInspectionsByRoomIds,
  getImagesForInspection
} from './reportQueryUtils';

/**
 * Functions for querying and fetching reports
 */

/**
 * Get all reports
 */
export const getAllReports = async (): Promise<Report[]> => {
  try {
    // Fetch all inspections
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching inspections:', error);
      return [];
    }
    
    const reports: Report[] = [];
    
    // Load each report with minimal data (no rooms)
    for (const inspection of inspections) {
      // Get the room
      const room = await getRoomById(inspection.room_id);
      if (!room) continue;
      
      // Get property
      const property = await getPropertyById(room.property_id);
      if (!property) continue;
      
      // Transform to our client format
      reports.push(transformInspectionToReport(inspection, room, property));
    }
    
    return reports;
  } catch (error) {
    console.error('Error in getAll:', error);
    return [];
  }
};

/**
 * Get reports by property ID
 */
export const getReportsByPropertyId = async (propertyId: string): Promise<Report[]> => {
  try {
    // First get all rooms for this property
    const rooms = await getRoomsByPropertyId(propertyId);
    if (!rooms || !rooms.length) {
      return [];
    }
    
    const roomIds = rooms.map(r => r.id);
    
    // Get all inspections for these rooms
    const inspections = await getInspectionsByRoomIds(roomIds);
    if (!inspections || !inspections.length) {
      return [];
    }
    
    const property = await getPropertyById(propertyId);
    if (!property) {
      console.error('Property not found:', propertyId);
      return [];
    }
    
    const reports: Report[] = [];
    
    // Process each inspection
    for (const inspection of inspections) {
      // Get the room
      const room = await getRoomById(inspection.room_id);
      if (!room) continue;
      
      reports.push(transformInspectionToReport(inspection, room, property));
    }
    
    return reports;
  } catch (error) {
    console.error('Error in getByPropertyId:', error);
    return [];
  }
};

/**
 * Get full report by ID with all rooms
 */
export const getReportById = async (reportId: string): Promise<Report | null> => {
  try {
    // Get inspection
    const { data: inspection, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', reportId)
      .single();
    
    if (error) {
      console.error('Error fetching inspection:', error);
      return null;
    }
    
    // Get the room
    const room = await getRoomById(inspection.room_id);
    if (!room) {
      console.error('Room not found:', inspection.room_id);
      return null;
    }
    
    // Get property
    const property = await getPropertyById(room.property_id);
    if (!property) {
      console.error('Property not found:', room.property_id);
      return null;
    }
    
    // Transform to our client format - basic report
    const report = transformInspectionToReport(inspection, room, property);
    
    // Process room data
    const { parseReportInfo, formatRoomType } = await import('./reportTransformers');
    const reportInfo = parseReportInfo(inspection.report_info);
    
    // Initialize with an empty rooms array - don't add the main room by default
    report.rooms = [];
    
    // Only add main room if it has content (generalCondition or components)
    if (reportInfo.generalCondition || (reportInfo.components && reportInfo.components.length > 0)) {
      const mainRoom = await processMainRoom(reportId, room, reportInfo, formatRoomType);
      report.rooms.push(mainRoom);
    }
    
    // Process additional rooms from report_info
    const additionalRooms = await processAdditionalRooms(reportId, reportInfo);
    
    // Add additional rooms to the report
    if (additionalRooms.length > 0) {
      report.rooms = [...report.rooms, ...additionalRooms];
    }
    
    // Sort rooms by order if there are any rooms
    if (report.rooms.length > 0) {
      report.rooms.sort((a, b) => a.order - b.order);
    }
    
    return report;
  } catch (error) {
    console.error('Error in getById:', error);
    return null;
  }
};
