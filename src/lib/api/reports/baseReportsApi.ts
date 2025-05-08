
import { Report, Room } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { parseReportInfo, transformInspectionToReport, formatRoomType } from './reportTransformers';

/**
 * Base Reports API for fetching and creating reports
 */
export const BaseReportsAPI = {
  /**
   * Get all reports
   */
  getAll: async (): Promise<Report[]> => {
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
  },
  
  /**
   * Get reports by property ID
   */
  getByPropertyId: async (propertyId: string): Promise<Report[]> => {
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
  },
  
  /**
   * Get full report by ID with all rooms
   */
  getById: async (reportId: string): Promise<Report | null> => {
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
      const reportInfo = parseReportInfo(inspection.report_info);
      
      // Add main room
      const mainRoom: Room = {
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
      
      // Process additional rooms from report_info
      const additionalRooms: Room[] = [];
      
      if (reportInfo.additionalRooms && Array.isArray(reportInfo.additionalRooms)) {
        for (const additionalRoom of reportInfo.additionalRooms) {
          const { data: roomData } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', additionalRoom.id)
            .single();
            
          if (!roomData) continue;
          
          // Use the name from additional rooms data or format type as fallback
          const roomName = additionalRoom.name || formatRoomType(additionalRoom.type);
          
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
      
      // Sort rooms by order
      const allRooms = [mainRoom, ...additionalRooms].sort((a, b) => a.order - b.order);
      report.rooms = allRooms;
      
      return report;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  },
  
  /**
   * Create a new report
   */
  create: async (propertyId: string, type: string): Promise<Report | null> => {
    try {
      // Create a new room for the report
      const roomId = crypto.randomUUID();
      
      await supabase.from('rooms').insert({
        id: roomId,
        property_id: propertyId,
        type: 'living_room' // Default room type
      });
      
      // Create a new inspection
      const reportId = crypto.randomUUID();
      
      await supabase.from('inspections').insert({
        id: reportId,
        room_id: roomId,
        inspection_type: type,
        status: 'draft',
        report_info: JSON.stringify({
          reportDate: new Date().toISOString(),
          roomName: 'Living Room', // Default room name
          clerk: 'Inspector',
          sections: [],
          components: []
        })
      });
      
      // Get the property
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
        
      if (!property) {
        console.error('Property not found:', propertyId);
        return null;
      }
      
      // Get the room
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      // Get the inspection
      const { data: inspection } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (!inspection || !room) {
        console.error('Failed to load created report');
        return null;
      }
      
      // Transform to client format
      return transformInspectionToReport(inspection, room, property);
    } catch (error) {
      console.error('Error creating report:', error);
      return null;
    }
  },
};
