import { Report, Room, RoomType, RoomImage } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { createNewReport, createNewRoom } from '../mockData';
import { supabase } from '@/integrations/supabase/client';
import { uploadReportImage, deleteReportImage } from '@/utils/supabaseStorage';

// Reports API
export const ReportsAPI = {
  getAll: async (): Promise<Report[]> => {
    // First, get reports
    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      throw reportsError;
    }
    
    if (!reportsData || reportsData.length === 0) {
      return [];
    }
    
    // Then fetch properties for these reports
    const propertyIds = [...new Set(reportsData.map(r => r.propertyId))];
    
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .in('id', propertyIds);
      
    if (propertiesError) {
      console.error('Error fetching properties for reports:', propertiesError);
      throw propertiesError;
    }
    
    // Create a map for quick property lookup
    const propertiesMap = (propertiesData || []).reduce((acc, prop) => {
      acc[prop.id] = prop;
      return acc;
    }, {} as Record<string, any>);
    
    // Transform the data to match our client-side model
    const reports: Report[] = reportsData.map(report => ({
      id: report.id,
      name: report.name || '',
      propertyId: report.propertyId,
      property: propertiesMap[report.propertyId] ? {
        id: propertiesMap[report.propertyId].id,
        name: propertiesMap[report.propertyId].name || '',
        address: propertiesMap[report.propertyId].address,
        city: propertiesMap[report.propertyId].city,
        state: propertiesMap[report.propertyId].state,
        zipCode: propertiesMap[report.propertyId].zipCode,
        propertyType: propertiesMap[report.propertyId].type,
        bedrooms: propertiesMap[report.propertyId].bedrooms || 0,
        bathrooms: propertiesMap[report.propertyId].bathrooms || 0,
        squareFeet: 0,
        imageUrl: propertiesMap[report.propertyId].description || '',
        createdAt: new Date(propertiesMap[report.propertyId].createdAt),
        updatedAt: new Date(propertiesMap[report.propertyId].updatedAt)
      } : null,
      type: report.type,
      status: report.status,
      reportInfo: report.reportInfo || null,
      rooms: [], // Rooms will be loaded on demand for individual reports
      createdAt: new Date(report.createdAt),
      updatedAt: new Date(report.updatedAt),
      completedAt: report.completedAt ? new Date(report.completedAt) : null,
      disclaimers: []
    }));
    
    return reports;
  },
  
  getByPropertyId: async (propertyId: string): Promise<Report[]> => {
    // Get reports for a specific property
    const { data: reportsData, error } = await supabase
      .from('reports')
      .select('*')
      .eq('propertyId', propertyId)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching reports by property:', error);
      throw error;
    }
    
    if (!reportsData || reportsData.length === 0) {
      return [];
    }
    
    // Get the property data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
      
    if (propertyError) {
      console.error('Error fetching property for reports:', propertyError);
      throw propertyError;
    }
    
    // Transform the data
    const propertyData = property ? {
      id: property.id,
      name: property.name || '',
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      propertyType: property.type,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      squareFeet: 0,
      imageUrl: property.description || '',
      createdAt: new Date(property.createdAt),
      updatedAt: new Date(property.updatedAt)
    } : null;
    
    const reports: Report[] = reportsData.map(report => ({
      id: report.id,
      name: report.name || '',
      propertyId: report.propertyId,
      property: propertyData,
      type: report.type,
      status: report.status,
      reportInfo: report.reportInfo || null,
      rooms: [], // Rooms will be loaded on demand for individual reports
      createdAt: new Date(report.createdAt),
      updatedAt: new Date(report.updatedAt),
      completedAt: report.completedAt ? new Date(report.completedAt) : null,
      disclaimers: []
    }));
    
    return reports;
  },
  
  getById: async (id: string): Promise<Report | null> => {
    // Fetch the report
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (reportError) {
      console.error('Error fetching report:', reportError);
      if (reportError.code === 'PGRST116') return null; // Not found
      throw reportError;
    }
    
    if (!reportData) return null;
    
    // Fetch the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', reportData.propertyId)
      .single();
      
    if (propertyError) {
      console.error('Error fetching property:', propertyError);
      throw propertyError;
    }
    
    // Fetch the rooms for this report
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('reportId', id)
      .order('order_index', { ascending: true });
    
    if (roomsError) {
      console.error('Error fetching rooms:', roomsError);
      throw roomsError;
    }
    
    // Fetch images for all rooms
    const roomIds = roomsData.map(room => room.id);
    let imagesData = [];
    
    if (roomIds.length > 0) {
      const { data: roomImagesData, error: imagesError } = await supabase
        .from('room_images')
        .select('*')
        .in('roomId', roomIds);
      
      if (imagesError) {
        console.error('Error fetching room images:', imagesError);
        throw imagesError;
      }
      
      imagesData = roomImagesData || [];
    }
    
    // Organize images by room
    const imagesByRoom = imagesData.reduce((acc, img) => {
      if (!acc[img.roomId]) acc[img.roomId] = [];
      acc[img.roomId].push({
        id: img.id,
        url: img.url,
        timestamp: new Date(img.timestamp),
        aiProcessed: img.aiProcessed || false,
        aiData: img.analysis || null
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    // Transform property
    const propertyData = property ? {
      id: property.id,
      name: property.name || '',
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      propertyType: property.type,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      squareFeet: 0,
      imageUrl: property.description || '',
      createdAt: new Date(property.createdAt),
      updatedAt: new Date(property.updatedAt)
    } : null;
    
    // Assemble the full report with rooms and images
    const report: Report = {
      id: reportData.id,
      name: reportData.name || '',
      propertyId: reportData.propertyId,
      property: propertyData,
      type: reportData.type,
      status: reportData.status,
      reportInfo: reportData.reportInfo || null,
      rooms: roomsData.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type as RoomType,
        order: room.order_index,
        generalCondition: room.generalCondition || undefined,
        sections: room.sections || [],
        components: room.components || [],
        images: imagesByRoom[room.id] || []
      })),
      createdAt: new Date(reportData.createdAt),
      updatedAt: new Date(reportData.updatedAt),
      completedAt: reportData.completedAt ? new Date(reportData.completedAt) : null,
      disclaimers: []
    };
    
    return report;
  },
  
  create: async (propertyId: string, type: 'check_in' | 'check_out' | 'inspection'): Promise<Report> => {
    const newReport = createNewReport(propertyId, type);
    
    const { data, error } = await supabase
      .from('reports')
      .insert({
        id: newReport.id,
        propertyId: propertyId,
        type: type,
        status: 'draft',
        name: newReport.name
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating report:', error);
      throw error;
    }
    
    return {
      ...data,
      rooms: []
    };
  },
  
  update: async (id: string, updates: Partial<Report>): Promise<Report | null> => {
    const { data, error } = await supabase
      .from('reports')
      .update({
        ...updates,
        updatedAt: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating report:', error);
      throw error;
    }
    
    // Get the full report with rooms after update
    return await ReportsAPI.getById(id);
  },
  
  delete: async (id: string): Promise<void> => {
    // First, fetch the report to get room IDs
    const report = await ReportsAPI.getById(id);
    if (!report) return;
    
    // Delete images associated with rooms
    for (const room of report.rooms) {
      for (const image of room.images) {
        await deleteReportImage(image.url);
      }
    }
    
    // Delete the report (cascade will handle rooms and images)
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },
  
  duplicate: async (id: string): Promise<Report | null> => {
    const reportToDuplicate = await ReportsAPI.getById(id);
    
    if (!reportToDuplicate) return null;
    
    // Create new report
    const newReportId = uuidv4();
    const { data: newReport, error } = await supabase
      .from('reports')
      .insert({
        id: newReportId,
        propertyId: reportToDuplicate.propertyId,
        name: `${reportToDuplicate.name || ''} (Copy)`,
        type: reportToDuplicate.type,
        status: 'draft',
        reportInfo: reportToDuplicate.reportInfo
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error duplicating report:', error);
      throw error;
    }
    
    // Duplicate rooms
    for (const room of reportToDuplicate.rooms) {
      const newRoomId = uuidv4();
      
      await supabase
        .from('rooms')
        .insert({
          id: newRoomId,
          reportId: newReportId,
          name: room.name,
          type: room.type,
          order_index: room.order,
          generalCondition: room.generalCondition,
          sections: room.sections,
          components: room.components ? room.components.map(component => ({
            ...component,
            id: uuidv4(),
            images: []
          })) : []
        });
    }
    
    // Get the complete new report
    return await ReportsAPI.getById(newReportId);
  },
  
  addRoom: async (reportId: string, name: string, type: RoomType): Promise<Room | null> => {
    // Get the current number of rooms for order
    const { data: existingRooms, error: countError } = await supabase
      .from('rooms')
      .select('id')
      .eq('reportId', reportId);
    
    if (countError) {
      console.error('Error counting rooms:', countError);
      throw countError;
    }
    
    const order = existingRooms.length + 1;
    const newRoomId = uuidv4();
    
    // Create the new room
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        id: newRoomId,
        reportId: reportId,
        name: name,
        type: type,
        order_index: order,
        sections: [],
        components: []
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating room:', error);
      throw error;
    }
    
    // Format to match our client model
    const newRoom: Room = {
      id: data.id,
      name: data.name,
      type: data.type as RoomType,
      order: data.order_index,
      sections: data.sections || [],
      components: data.components || [],
      images: []
    };
    
    return newRoom;
  },
  
  updateRoom: async (reportId: string, roomId: string, updates: Partial<Room>): Promise<Room | null> => {
    const updateData: any = { ...updates };
    
    // Remove fields not in the database model
    delete updateData.images;
    
    // Update camelCase to snake_case
    if (updates.generalCondition !== undefined) {
      updateData.generalCondition = updates.generalCondition;
    }
    
    const { data, error } = await supabase
      .from('rooms')
      .update({
        ...updateData,
        updatedAt: new Date()
      })
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating room:', error);
      throw error;
    }
    
    // Get images for the room
    const { data: images, error: imagesError } = await supabase
      .from('room_images')
      .select('*')
      .eq('roomId', roomId);
    
    if (imagesError) {
      console.error('Error fetching room images:', imagesError);
      throw imagesError;
    }
    
    // Format to match our client model
    const updatedRoom: Room = {
      id: data.id,
      name: data.name,
      type: data.type as RoomType,
      order: data.order_index,
      generalCondition: data.generalCondition,
      sections: data.sections || [],
      components: data.components || [],
      images: images || []
    };
    
    return updatedRoom;
  },
  
  addImageToRoom: async (reportId: string, roomId: string, imageUrl: string): Promise<RoomImage | null> => {
    // Get property details to create folder structure
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('propertyId, type')
      .eq('id', reportId)
      .single();
    
    if (reportError) {
      console.error('Error fetching report for image upload:', reportError);
      throw reportError;
    }
    
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('address, city, state')
      .eq('id', report.propertyId)
      .single();
    
    if (propertyError) {
      console.error('Error fetching property for image upload:', propertyError);
      throw propertyError;
    }

    // Upload image to Supabase storage
    const storedImageUrl = await uploadReportImage(
      imageUrl, 
      reportId, 
      `${property.address}, ${property.city}, ${property.state}`, 
      report.type
    );

    if (!storedImageUrl) return null;
    
    const imageId = uuidv4();
    
    // Save the image URL to the database
    const { data, error } = await supabase
      .from('room_images')
      .insert({
        id: imageId,
        roomId: roomId,
        url: storedImageUrl,
        aiProcessed: false,
        timestamp: new Date()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving room image:', error);
      throw error;
    }
    
    return data;
  },
  
  deleteRoom: async (reportId: string, roomId: string): Promise<void> => {
    // Fetch all images for this room
    const { data: images, error: imagesError } = await supabase
      .from('room_images')
      .select('url')
      .eq('roomId', roomId);
    
    if (imagesError) {
      console.error('Error fetching room images for deletion:', imagesError);
      throw imagesError;
    }
    
    // Delete all images from storage
    for (const image of images || []) {
      await deleteReportImage(image.url);
    }
    
    // Delete the room (cascade will delete images from the database)
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);
    
    if (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }
};
