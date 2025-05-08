
import { Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { transformInspectionToReport } from './reportTransformers';

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
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', inspection.room_id)
        .single();
        
      if (!room) continue;
      
      // Get property
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', room.property_id)
        .single();
        
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
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('property_id', propertyId);
      
    if (roomsError || !rooms.length) {
      console.error('Error fetching rooms:', roomsError);
      return [];
    }
    
    const roomIds = rooms.map(r => r.id);
    
    // Get all inspections for these rooms
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching inspections:', error);
      return [];
    }
    
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
      
    if (!property) {
      console.error('Property not found:', propertyId);
      return [];
    }
    
    const reports: Report[] = [];
    
    // Process each inspection
    for (const inspection of inspections) {
      // Get the room
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', inspection.room_id)
        .single();
        
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
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', inspection.room_id)
      .single();
    
    if (!room) {
      console.error('Room not found:', inspection.room_id);
      return null;
    }
    
    // Get property
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', room.property_id)
      .single();
      
    if (!property) {
      console.error('Property not found:', room.property_id);
      return null;
    }
    
    // Transform to our client format - basic report
    const report = transformInspectionToReport(inspection, room, property);
    
    // Process room data
    const { parseReportInfo, formatRoomType } = await import('./reportTransformers');
    const reportInfo = parseReportInfo(inspection.report_info);
    
    // Add main room
    const mainRoom = await processMainRoom(reportId, room, reportInfo, formatRoomType);
    
    // Process additional rooms from report_info
    const additionalRooms = await processAdditionalRooms(reportId, reportInfo);
    
    // Sort rooms by order
    const allRooms = [mainRoom, ...additionalRooms].sort((a, b) => a.order - b.order);
    report.rooms = allRooms;
    
    return report;
  } catch (error) {
    console.error('Error in getById:', error);
    return null;
  }
};

/**
 * Process main room for a report
 */
const processMainRoom = async (reportId: string, room: any, reportInfo: any, formatRoomType: (type: string) => string) => {
  // Add main room
  const mainRoom = {
    id: room.id,
    name: reportInfo.roomName || formatRoomType(room.type), // Use stored name or format type
    type: room.type as any,
    order: 0,
    generalCondition: reportInfo.generalCondition || '',
    sections: reportInfo.sections || [],
    components: reportInfo.components || [],
    images: []
  };
  
  // Get images for main room
  const { data: imageData } = await supabase
    .from('inspection_images')
    .select('*')
    .eq('inspection_id', reportId);
  
  const mainRoomImages = (imageData || [])
    .filter(img => !img.image_url.includes('/') || img.image_url.includes(`/${room.id}/`))
    .map(img => ({
      id: img.id,
      url: img.image_url,
      timestamp: new Date(img.created_at),
      aiProcessed: img.analysis !== null,
      aiData: img.analysis
    }));
  
  mainRoom.images = mainRoomImages;
  
  return mainRoom;
};

/**
 * Process additional rooms for a report
 */
const processAdditionalRooms = async (reportId: string, reportInfo: any) => {
  const additionalRooms = [];
  
  if (reportInfo.additionalRooms && Array.isArray(reportInfo.additionalRooms)) {
    for (const additionalRoom of reportInfo.additionalRooms) {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', additionalRoom.id)
        .single();
        
      if (!roomData) continue;
      
      // Use the name from additional rooms data or format type as fallback
      const { formatRoomType } = await import('./reportTransformers');
      const roomName = additionalRoom.name || formatRoomType(additionalRoom.type);
      
      // Get images for this room
      const { data: imageData } = await supabase
        .from('inspection_images')
        .select('*')
        .eq('inspection_id', reportId);
      
      additionalRooms.push({
        id: additionalRoom.id,
        name: roomName,
        type: roomData.type as any,
        order: additionalRoom.order || additionalRooms.length + 1,
        generalCondition: additionalRoom.generalCondition || '',
        sections: additionalRoom.sections || [],
        components: additionalRoom.components || [],
        images: (imageData || [])
          .filter(img => img.image_url.includes(`/${additionalRoom.id}/`))
          .map(img => ({
            id: img.id,
            url: img.image_url,
            timestamp: new Date(img.created_at),
            aiProcessed: img.analysis !== null,
            aiData: img.analysis
          }))
      });
    }
  }
  
  return additionalRooms;
};
