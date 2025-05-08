
import { Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { transformInspectionToReport } from './reportTransformers';

/**
 * Base ReportsAPI functions for fetching reports
 */
export const BaseReportsAPI = {
  /**
   * Get all reports
   */
  getAll: async (): Promise<Report[]> => {
    // First, get inspections (used as reports)
    const { data: inspectionsData, error: inspectionsError } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (inspectionsError) {
      console.error('Error fetching reports:', inspectionsError);
      throw inspectionsError;
    }
    
    if (!inspectionsData || inspectionsData.length === 0) {
      return [];
    }
    
    // Then fetch rooms for these inspections
    const roomIds = [...new Set(inspectionsData.map(r => r.room_id))];
    
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .in('id', roomIds);
      
    if (roomsError) {
      console.error('Error fetching rooms for reports:', roomsError);
      throw roomsError;
    }
    
    // Get property ids from rooms
    const propertyIds = [...new Set((roomsData || []).map(room => room.property_id))];
    
    // Fetch properties
    const { data: propertiesData, error: propertiesError } = propertyIds.length > 0 ? await supabase
      .from('properties')
      .select('*')
      .in('id', propertyIds) : { data: [], error: null };
      
    if (propertiesError) {
      console.error('Error fetching properties for reports:', propertiesError);
      throw propertiesError;
    }
    
    // Create maps for quick lookups
    const roomsMap = (roomsData || []).reduce((acc, room) => {
      acc[room.id] = room;
      return acc;
    }, {} as Record<string, any>);
    
    const propertiesMap = (propertiesData || []).reduce((acc, prop) => {
      acc[prop.id] = prop;
      return acc;
    }, {} as Record<string, any>);
    
    // Transform the data to match our client-side model
    const reports: Report[] = inspectionsData.map(inspection => {
      const room = roomsMap[inspection.room_id] || {};
      const property = room.property_id ? propertiesMap[room.property_id] : null;

      return transformInspectionToReport(inspection, room, property);
    });
    
    return reports;
  },
  
  /**
   * Get reports by property ID
   */
  getByPropertyId: async (propertyId: string): Promise<Report[]> => {
    // Get rooms for the property
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', propertyId);
    
    if (roomsError) {
      console.error('Error fetching rooms by property:', roomsError);
      throw roomsError;
    }
    
    if (!roomsData || roomsData.length === 0) {
      return [];
    }
    
    // Get room IDs
    const roomIds = roomsData.map(room => room.id);
    
    // Get inspections for these rooms
    const { data: inspectionsData, error: inspectionsError } = await supabase
      .from('inspections')
      .select('*')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false });
    
    if (inspectionsError) {
      console.error('Error fetching inspections by rooms:', inspectionsError);
      throw inspectionsError;
    }
    
    // Get the property data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
      
    if (propertyError && propertyError.code !== 'PGRST116') {
      console.error('Error fetching property for reports:', propertyError);
      throw propertyError;
    }
    
    // Create rooms map
    const roomsMap = roomsData.reduce((acc, room) => {
      acc[room.id] = room;
      return acc;
    }, {} as Record<string, any>);
    
    // Transform property for client-side model
    const propertyData = property ? {
      id: property.id,
      name: property.name || '',
      address: property.location ? property.location.split(',')[0]?.trim() : '',
      city: property.location ? property.location.split(',')[1]?.trim() : '',
      state: property.location ? property.location.split(',')[2]?.trim() : '',
      zipCode: property.location ? property.location.split(',')[3]?.trim() : '',
      propertyType: (property.type || 'house') as 'house' | 'apartment' | 'condo' | 'townhouse' | 'single_family' | 'multi_family' | 'commercial',
      bedrooms: Number(property.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(property.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0,
      imageUrl: property.image_url || '',
      createdAt: new Date(property.created_at),
      updatedAt: new Date(property.updated_at)
    } : null;
    
    // Transform the data for client-side model
    const reports: Report[] = (inspectionsData || []).map(inspection => {
      const room = roomsMap[inspection.room_id];
      return transformInspectionToReport(inspection, room, propertyData);
    });
    
    return reports;
  },
  
  /**
   * Get a report by ID
   */
  getById: async (id: string): Promise<Report | null> => {
    // Fetch the inspection
    const { data: inspectionData, error: inspectionError } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single();
    
    if (inspectionError) {
      console.error('Error fetching inspection:', inspectionError);
      if (inspectionError.code === 'PGRST116') return null; // Not found
      throw inspectionError;
    }
    
    if (!inspectionData) return null;
    
    // Fetch the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', inspectionData.room_id)
      .single();
      
    if (roomError) {
      console.error('Error fetching room:', roomError);
      throw roomError;
    }
    
    // Fetch the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', room.property_id)
      .single();
      
    if (propertyError) {
      console.error('Error fetching property:', propertyError);
      throw propertyError;
    }
    
    // Fetch images for the inspection
    const { data: imagesData, error: imagesError } = await supabase
      .from('inspection_images')
      .select('*')
      .eq('inspection_id', id);
    
    if (imagesError) {
      console.error('Error fetching inspection images:', imagesError);
      throw imagesError;
    }
    
    // Transform property for client-side model
    const propertyData = property ? {
      id: property.id,
      name: property.name || '',
      address: property.location ? property.location.split(',')[0]?.trim() : '',
      city: property.location ? property.location.split(',')[1]?.trim() : '',
      state: property.location ? property.location.split(',')[2]?.trim() : '',
      zipCode: property.location ? property.location.split(',')[3]?.trim() : '',
      propertyType: (property.type || 'house') as 'house' | 'apartment' | 'condo' | 'townhouse' | 'single_family' | 'multi_family' | 'commercial',
      bedrooms: Number(property.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(property.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0,
      imageUrl: property.image_url || '',
      createdAt: new Date(property.created_at),
      updatedAt: new Date(property.updated_at)
    } : null;
    
    // Transform images for client-side model
    const images = (imagesData || []).map(img => ({
      id: img.id,
      url: img.image_url,
      timestamp: new Date(img.created_at),
      aiProcessed: img.analysis !== null,
      aiData: img.analysis || null
    }));
    
    // Get any report_info data including components
    const reportInfoData = inspectionData.report_info ? 
      (typeof inspectionData.report_info === 'string' 
        ? JSON.parse(inspectionData.report_info) 
        : inspectionData.report_info) as Record<string, any> 
      : {};
    
    // Get components from report_info, ensuring it's an array
    const components = Array.isArray(reportInfoData.components) ? reportInfoData.components : [];
    
    // Map status to valid enum values
    let status: "draft" | "in_progress" | "pending_review" | "completed" | "archived" = "draft";
    if (inspectionData.status === "in_progress") status = "in_progress";
    else if (inspectionData.status === "pending_review") status = "pending_review";
    else if (inspectionData.status === "completed") status = "completed";
    else if (inspectionData.status === "archived") status = "archived";
    
    // Assemble the full report
    const report: Report = {
      id: inspectionData.id,
      name: inspectionData.status || '',
      propertyId: room.property_id,
      property: propertyData,
      type: 'inspection',
      status: status,
      reportInfo: { 
        reportDate: new Date().toISOString(), // Use ISO string format
        additionalInfo: inspectionData.report_url || '',
        ...(reportInfoData as Partial<Report['reportInfo']>)
      },
      // For simplicity, we'll use a single room which is the one attached to the inspection
      rooms: [{
        id: room.id,
        name: reportInfoData.roomName || String(room.type), // Use roomName from report_info if available, otherwise use type
        type: room.type as any,
        order: 1,
        generalCondition: reportInfoData.generalCondition || '',
        images: images,
        sections: reportInfoData.sections || [], 
        components: components
      }],
      createdAt: new Date(inspectionData.created_at),
      updatedAt: new Date(inspectionData.updated_at),
      completedAt: null,
      disclaimers: []
    };
    
    // Add console log for debugging component count
    const componentsCount = Array.isArray(components) ? components.length : 0;
    console.log("Loaded report with components:", componentsCount);
    
    // Get additional rooms from report_info
    if (reportInfoData && reportInfoData.additionalRooms && Array.isArray(reportInfoData.additionalRooms) && reportInfoData.additionalRooms.length > 0) {
      report.rooms = [...report.rooms, ...reportInfoData.additionalRooms.map((room: any) => ({
        id: room.id,
        name: room.name || String(room.type),
        type: room.type as any,
        order: room.order || 0,
        generalCondition: room.generalCondition || '',
        images: [],
        sections: room.sections || [],
        components: room.components || []
      }))];
    }
    
    return report;
  },
  
  /**
   * Create a new report
   */
  create: async (propertyId: string, type: 'check_in' | 'check_out' | 'inspection'): Promise<Report> => {
    // First we need to create a room for the property if it doesn't exist
    const roomId = crypto.randomUUID();
    
    await supabase.from('rooms').insert({
      id: roomId,
      property_id: propertyId,
      type: type === 'inspection' ? 'general' : type
    });
    
    // Now create the inspection
    const inspectionId = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('inspections')
      .insert({
        id: inspectionId,
        room_id: roomId,
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating inspection:', error);
      throw error;
    }
    
    // Return a simplified report structure
    return {
      id: data.id,
      propertyId: propertyId,
      name: data.status,
      type: 'inspection',
      status: 'draft',
      reportInfo: {
        reportDate: new Date().toISOString() // Use ISO string format
      },
      rooms: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: null,
      disclaimers: []
    };
  }
};
