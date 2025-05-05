
import { Report, Room, RoomType, RoomImage } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { createNewReport, createNewRoom } from '../mockData';
import { supabase } from '@/integrations/supabase/client';
import { uploadReportImage, deleteReportImage } from '@/utils/supabaseStorage';

// Reports API
// This is a temporary implementation that uses the inspections table
// until we have proper reports table in the database
export const ReportsAPI = {
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
      
      const propertyData = property ? {
        id: property.id,
        name: property.name || '',
        address: property.location ? property.location.split(',')[0]?.trim() : '',
        city: property.location ? property.location.split(',')[1]?.trim() : '',
        state: property.location ? property.location.split(',')[2]?.trim() : '',
        zipCode: property.location ? property.location.split(',')[3]?.trim() : '',
        propertyType: property.type,
        bedrooms: Number(property.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
        bathrooms: Number(property.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
        squareFeet: 0,
        imageUrl: property.image_url || '',
        createdAt: new Date(property.created_at),
        updatedAt: new Date(property.updated_at)
      } : null;
      
      return {
        id: inspection.id,
        name: inspection.status || '',
        propertyId: room.property_id || '',
        property: propertyData,
        type: 'inspection',
        status: inspection.status,
        reportInfo: { reportUrl: inspection.report_url || '' },
        rooms: [], // We'll populate rooms on-demand for individual reports
        createdAt: new Date(inspection.created_at),
        updatedAt: new Date(inspection.updated_at),
        completedAt: null,
        disclaimers: []
      };
    });
    
    return reports;
  },
  
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
    
    // Transform the data
    const propertyData = property ? {
      id: property.id,
      name: property.name || '',
      address: property.location ? property.location.split(',')[0]?.trim() : '',
      city: property.location ? property.location.split(',')[1]?.trim() : '',
      state: property.location ? property.location.split(',')[2]?.trim() : '',
      zipCode: property.location ? property.location.split(',')[3]?.trim() : '',
      propertyType: property.type,
      bedrooms: Number(property.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(property.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0,
      imageUrl: property.image_url || '',
      createdAt: new Date(property.created_at),
      updatedAt: new Date(property.updated_at)
    } : null;
    
    const reports: Report[] = (inspectionsData || []).map(inspection => {
      const room = roomsMap[inspection.room_id];
      
      return {
        id: inspection.id,
        name: inspection.status || '',
        propertyId: room?.property_id || '',
        property: propertyData,
        type: 'inspection',
        status: inspection.status,
        reportInfo: { reportUrl: inspection.report_url || '' },
        rooms: [], // Rooms will be loaded on demand for individual reports
        createdAt: new Date(inspection.created_at),
        updatedAt: new Date(inspection.updated_at),
        completedAt: null,
        disclaimers: []
      };
    });
    
    return reports;
  },
  
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
    
    // Transform property
    const propertyData = property ? {
      id: property.id,
      name: property.name || '',
      address: property.location ? property.location.split(',')[0]?.trim() : '',
      city: property.location ? property.location.split(',')[1]?.trim() : '',
      state: property.location ? property.location.split(',')[2]?.trim() : '',
      zipCode: property.location ? property.location.split(',')[3]?.trim() : '',
      propertyType: property.type,
      bedrooms: Number(property.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(property.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0,
      imageUrl: property.image_url || '',
      createdAt: new Date(property.created_at),
      updatedAt: new Date(property.updated_at)
    } : null;
    
    // Transform images
    const images = (imagesData || []).map(img => ({
      id: img.id,
      url: img.image_url,
      timestamp: new Date(img.created_at),
      aiProcessed: img.analysis !== null,
      aiData: img.analysis || null
    }));
    
    // Assemble the full report
    const report: Report = {
      id: inspectionData.id,
      name: inspectionData.status || '',
      propertyId: room.property_id,
      property: propertyData,
      type: 'inspection',
      status: inspectionData.status,
      reportInfo: { reportUrl: inspectionData.report_url || '' },
      // For simplicity, we'll use a single room which is the one attached to the inspection
      rooms: [{
        id: room.id,
        name: room.type,
        type: room.type as RoomType,
        order: 1,
        images: images
      } as Room],
      createdAt: new Date(inspectionData.created_at),
      updatedAt: new Date(inspectionData.updated_at),
      completedAt: null,
      disclaimers: []
    };
    
    return report;
  },
  
  // For the remaining methods, we'll implement simplified versions or stubs
  // that work with the existing database schema
  
  create: async (propertyId: string, type: 'check_in' | 'check_out' | 'inspection'): Promise<Report> => {
    // First we need to create a room for the property if it doesn't exist
    const roomId = uuidv4();
    
    await supabase.from('rooms').insert({
      id: roomId,
      property_id: propertyId,
      type: type === 'inspection' ? 'general' : type
    });
    
    // Now create the inspection
    const inspectionId = uuidv4();
    
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
      status: data.status,
      reportInfo: null,
      rooms: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: null,
      disclaimers: []
    };
  },
  
  update: async (id: string, updates: Partial<Report>): Promise<Report | null> => {
    const updateData: any = {};
    
    if (updates.status) {
      updateData.status = updates.status;
    }
    
    if (updates.reportInfo?.reportUrl) {
      updateData.report_url = updates.reportInfo.reportUrl;
    }
    
    const { error } = await supabase
      .from('inspections')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating report:', error);
      throw error;
    }
    
    // Get the full report after update
    return await ReportsAPI.getById(id);
  },
  
  delete: async (id: string): Promise<void> => {
    // First, get inspection to get room ID
    const { data: inspection } = await supabase
      .from('inspections')
      .select('room_id')
      .eq('id', id)
      .single();
      
    if (!inspection) return;
    
    // Delete all inspection images
    const { data: images } = await supabase
      .from('inspection_images')
      .select('image_url')
      .eq('inspection_id', id);
    
    if (images && images.length > 0) {
      for (const image of images) {
        await deleteReportImage(image.image_url);
      }
      
      // Delete image records
      await supabase
        .from('inspection_images')
        .delete()
        .eq('inspection_id', id);
    }
    
    // Delete the inspection
    await supabase
      .from('inspections')
      .delete()
      .eq('id', id);
    
    // Optionally delete the room if it's no longer needed
    // This is assuming rooms are 1:1 with inspections
    await supabase
      .from('rooms')
      .delete()
      .eq('id', inspection.room_id);
  },
  
  duplicate: async (id: string): Promise<Report | null> => {
    const reportToDuplicate = await ReportsAPI.getById(id);
    
    if (!reportToDuplicate) return null;
    
    // Create a new report based on the existing one
    const newReport = await ReportsAPI.create(
      reportToDuplicate.propertyId, 
      'inspection'
    );
    
    return newReport;
  },
  
  addRoom: async (reportId: string, name: string, type: RoomType): Promise<Room | null> => {
    // In our temporary schema, rooms and inspections have a 1:1 relationship
    // So we'll just return the existing room
    const { data: inspection } = await supabase
      .from('inspections')
      .select('room_id')
      .eq('id', reportId)
      .single();
    
    if (!inspection) return null;
    
    // Get the room
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', inspection.room_id)
      .single();
    
    if (!room) return null;
    
    // Return the room in our client format
    return {
      id: room.id,
      name: name,
      type: type,
      order: 1,
      images: []
    };
  },
  
  updateRoom: async (reportId: string, roomId: string, updates: Partial<Room>): Promise<Room | null> => {
    // Update the room type
    if (updates.type) {
      await supabase
        .from('rooms')
        .update({ type: updates.type })
        .eq('id', roomId);
    }
    
    // Get the room
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (!room) return null;
    
    // Get images for the room via inspection
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id')
      .eq('room_id', roomId)
      .single();
    
    const { data: images } = inspection ? await supabase
      .from('inspection_images')
      .select('*')
      .eq('inspection_id', inspection.id) : { data: null };
    
    // Return the room in our client format
    return {
      id: room.id,
      name: updates.name || room.type,
      type: room.type as RoomType,
      order: updates.order || 1,
      images: (images || []).map(img => ({
        id: img.id,
        url: img.image_url,
        timestamp: new Date(img.created_at),
        aiProcessed: img.analysis !== null,
        aiData: img.analysis
      }))
    };
  },
  
  addImageToRoom: async (reportId: string, roomId: string, imageUrl: string): Promise<RoomImage | null> => {
    // For our schema, images are associated with inspections, not rooms directly
    
    // Upload image to Supabase storage if needed
    // For simplicity, we'll assume imageUrl is already in storage
    
    const imageId = uuidv4();
    
    // Save the image URL to the database
    const { data, error } = await supabase
      .from('inspection_images')
      .insert({
        id: imageId,
        inspection_id: reportId,
        image_url: imageUrl
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving inspection image:', error);
      throw error;
    }
    
    return {
      id: data.id,
      url: data.image_url,
      timestamp: new Date(data.created_at),
      aiProcessed: false
    };
  },
  
  deleteRoom: async (reportId: string, roomId: string): Promise<void> => {
    // In our schema, deleting a room means deleting the inspection
    await ReportsAPI.delete(reportId);
  }
};
