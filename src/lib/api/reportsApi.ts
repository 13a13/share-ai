
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

      // Map status to valid enum values
      let status: "draft" | "in_progress" | "pending_review" | "completed" | "archived" = "draft";
      if (inspection.status === "in_progress") status = "in_progress";
      else if (inspection.status === "pending_review") status = "pending_review";
      else if (inspection.status === "completed") status = "completed";
      else if (inspection.status === "archived") status = "archived";
      
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
      
      return {
        id: inspection.id,
        name: inspection.status || '',
        propertyId: room.property_id || '',
        property: propertyData,
        type: 'inspection',
        status: status,
        reportInfo: { 
          reportDate: new Date().toISOString(), // Use ISO string format
          additionalInfo: inspection.report_url || '' 
        },
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
      propertyType: (property.type || 'house') as 'house' | 'apartment' | 'condo' | 'townhouse' | 'single_family' | 'multi_family' | 'commercial',
      bedrooms: Number(property.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(property.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0,
      imageUrl: property.image_url || '',
      createdAt: new Date(property.created_at),
      updatedAt: new Date(property.updated_at)
    } : null;
    
    const reports: Report[] = (inspectionsData || []).map(inspection => {
      const room = roomsMap[inspection.room_id];
      
      // Map status to valid enum values
      let status: "draft" | "in_progress" | "pending_review" | "completed" | "archived" = "draft";
      if (inspection.status === "in_progress") status = "in_progress";
      else if (inspection.status === "pending_review") status = "pending_review";
      else if (inspection.status === "completed") status = "completed";
      else if (inspection.status === "archived") status = "archived";
      
      return {
        id: inspection.id,
        name: inspection.status || '',
        propertyId: room?.property_id || '',
        property: propertyData,
        type: 'inspection',
        status: status,
        reportInfo: { 
          reportDate: new Date().toISOString(), // Use ISO string format
          additionalInfo: inspection.report_url || ''
        },
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
      propertyType: (property.type || 'house') as 'house' | 'apartment' | 'condo' | 'townhouse' | 'single_family' | 'multi_family' | 'commercial',
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
        type: room.type as RoomType,
        order: 1,
        generalCondition: reportInfoData.generalCondition || '',
        images: images,
        sections: reportInfoData.sections || [], 
        components: components
      } as Room],
      createdAt: new Date(inspectionData.created_at),
      updatedAt: new Date(inspectionData.updated_at),
      completedAt: null,
      disclaimers: []
    };
    
    // Add console log for debugging component count
    const componentsCount = Array.isArray(components) ? components.length : 0;
    console.log("Loaded report with components:", componentsCount);
    
    // Get additional rooms from report_info
    if (reportInfoData.additionalRooms && Array.isArray(reportInfoData.additionalRooms) && reportInfoData.additionalRooms.length > 0) {
      report.rooms = [...report.rooms, ...reportInfoData.additionalRooms.map((room: any) => ({
        id: room.id,
        name: room.name || String(room.type),
        type: room.type as RoomType,
        order: room.order || 0,
        generalCondition: room.generalCondition || '',
        images: [],
        sections: room.sections || [],
        components: room.components || []
      } as Room))];
    }
    
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
  },
  
  update: async (id: string, updates: Partial<Report>): Promise<Report | null> => {
    const updateData: any = {};
    
    if (updates.status) {
      updateData.status = updates.status;
    }
    
    if (updates.reportInfo?.additionalInfo) {
      updateData.report_url = updates.reportInfo.additionalInfo;
    }
    
    // Add support for file URLs in the report_info column
    if (updates.reportInfo?.fileUrl !== undefined || updates.reportInfo?.clerk !== undefined || 
        updates.reportInfo?.inventoryType !== undefined || updates.reportInfo?.tenantName !== undefined || 
        updates.reportInfo?.tenantPresent !== undefined) {
      // Get the existing report first
      const { data: existingReport, error: fetchError } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching report for update:', fetchError);
        throw fetchError;
      }
      
      // Initialize report info as an empty object or use existing
      const reportInfo = (existingReport && existingReport.report_info) 
        ? (typeof existingReport.report_info === 'string'
            ? JSON.parse(existingReport.report_info)
            : existingReport.report_info) as Record<string, any> 
        : {};
      
      // Update with any provided report info fields
      const updatedReportInfo: Record<string, any> = { ...reportInfo };
      
      if (updates.reportInfo?.fileUrl !== undefined) {
        updatedReportInfo.fileUrl = updates.reportInfo.fileUrl;
      }
      
      if (updates.reportInfo?.clerk !== undefined) {
        updatedReportInfo.clerk = updates.reportInfo.clerk;
      }
      
      if (updates.reportInfo?.inventoryType !== undefined) {
        updatedReportInfo.inventoryType = updates.reportInfo.inventoryType;
      }
      
      if (updates.reportInfo?.tenantPresent !== undefined) {
        updatedReportInfo.tenantPresent = updates.reportInfo.tenantPresent;
      }
      
      if (updates.reportInfo?.tenantName !== undefined) {
        updatedReportInfo.tenantName = updates.reportInfo.tenantName;
      }
      
      // Add any rooms if they exist in updates
      if (updates.rooms && updates.rooms.length > 0) {
        // Get the main room ID - first room is always the main one linked to the inspection
        const mainRoomId = updates.rooms[0]?.id;
        
        // Separate main room from additional rooms
        const additionalRooms = updates.rooms
          .filter(room => room.id !== mainRoomId)
          .map(room => ({
            id: room.id,
            name: room.name,
            type: room.type,
            generalCondition: room.generalCondition,
            components: room.components || []
          }));
        
        // Get the main room for direct properties
        const mainRoom = updates.rooms.find(room => room.id === mainRoomId);
        
        if (mainRoom) {
          updatedReportInfo.roomName = mainRoom.name;
          updatedReportInfo.generalCondition = mainRoom.generalCondition;
          updatedReportInfo.components = mainRoom.components || [];
          updatedReportInfo.sections = mainRoom.sections || [];
        }
        
        // Add additional rooms
        updatedReportInfo.additionalRooms = additionalRooms;
      }
      
      updateData.report_info = updatedReportInfo;
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
    try {
      console.log(`Adding new room: ${name} (${type})`);
      
      // Get the report first to get the property ID
      const { data: inspection } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', reportId)
        .single();
      
      if (!inspection) {
        console.error("No inspection found for report:", reportId);
        return null;
      }
      
      // Get the existing room to get the property ID
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('property_id')
        .eq('id', inspection.room_id)
        .single();
        
      if (!existingRoom) {
        console.error("No existing room found for inspection:", inspection.room_id);
        return null;
      }
      
      // Create a new room with the same property ID
      const roomId = uuidv4();
      
      await supabase.from('rooms').insert({
        id: roomId,
        property_id: existingRoom.property_id,
        type: type,
        // Note: name isn't a column in the rooms table, we'll store it in the inspection's report_info
      });
      
      console.log(`Created new room with ID: ${roomId}`);
      
      // Store the room name and other data in the report_info of the inspection
      const existingReportInfo = inspection.report_info ? 
        (typeof inspection.report_info === 'string' 
          ? JSON.parse(inspection.report_info) 
          : inspection.report_info) as Record<string, any> 
        : {};
        
      const additionalRooms = Array.isArray(existingReportInfo.additionalRooms) 
        ? existingReportInfo.additionalRooms 
        : [];
      
      additionalRooms.push({
        id: roomId,
        name: name,
        type: type,
        generalCondition: '',
        components: []
      });
      
      // Update the inspection with the additional room info
      await supabase
        .from('inspections')
        .update({
          report_info: {
            ...existingReportInfo,
            additionalRooms: additionalRooms
          }
        })
        .eq('id', reportId);
      
      // Return the room in our client format
      return {
        id: roomId,
        name: name, // Use the name provided by the user
        type: type,
        order: additionalRooms.length,
        generalCondition: '',
        images: [],
        sections: [],
        components: []
      };
    } catch (error) {
      console.error("Error adding room:", error);
      return null;
    }
  },
  
  updateRoom: async (reportId: string, roomId: string, updates: Partial<Room>): Promise<Room | null> => {
    console.log("Updating room with:", { reportId, roomId, updates });
    
    try {
      // Get the inspection for the report
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (inspectionError) {
        console.error("Error fetching inspection:", inspectionError);
        return null;
      }
      
      // Check if this is the main room or an additional room
      const isMainRoom = inspection.room_id === roomId;
      
      if (isMainRoom) {
        // Update the room type if needed
        if (updates.type) {
          await supabase
            .from('rooms')
            .update({ type: updates.type })
            .eq('id', roomId);
        }
        
        // Update the room data in report_info
        const reportInfo = inspection.report_info ? 
          (typeof inspection.report_info === 'string' 
            ? JSON.parse(inspection.report_info) 
            : inspection.report_info) as Record<string, any> 
          : {};
        
        // Update the relevant fields
        const updatedReportInfo = {
          ...reportInfo,
          roomName: updates.name || reportInfo.roomName, // Store the room name
          generalCondition: updates.generalCondition !== undefined ? updates.generalCondition : reportInfo.generalCondition,
          components: updates.components || reportInfo.components || [],
          sections: updates.sections || reportInfo.sections || []
        };
        
        await supabase
          .from('inspections')
          .update({ report_info: updatedReportInfo })
          .eq('id', reportId);
          
        // Get the room data
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();
          
        if (!room) {
          console.error("Room not found:", roomId);
          return null;
        }
        
        // Get images for the room
        const { data: imageData } = await supabase
          .from('inspection_images')
          .select('*')
          .eq('inspection_id', reportId);
          
        const roomImages = (imageData || []).map(img => ({
          id: img.id,
          url: img.image_url,
          timestamp: new Date(img.created_at),
          aiProcessed: img.analysis !== null,
          aiData: img.analysis
        }));
        
        // Return the updated room
        return {
          id: roomId,
          name: updates.name || (reportInfo.roomName ? String(reportInfo.roomName) : String(room.type)), // Use the updated name
          type: room.type as RoomType,
          order: updates.order || 1,
          generalCondition: updatedReportInfo.generalCondition || '',
          sections: updatedReportInfo.sections || [],
          components: updatedReportInfo.components || [],
          images: roomImages
        };
      } else {
        // This is an additional room
        const reportInfo = inspection.report_info ? 
          (typeof inspection.report_info === 'string' 
            ? JSON.parse(inspection.report_info) 
            : inspection.report_info) as Record<string, any> 
          : {};
        
        const additionalRooms = Array.isArray(reportInfo.additionalRooms) 
          ? reportInfo.additionalRooms 
          : [];
        
        // Find the room in the additional rooms array
        const roomIndex = additionalRooms.findIndex((room: any) => room.id === roomId);
        
        if (roomIndex === -1) {
          console.error("Room not found in additional rooms:", roomId);
          return null;
        }
        
        // Update the room data
        additionalRooms[roomIndex] = {
          ...additionalRooms[roomIndex],
          name: updates.name || additionalRooms[roomIndex].name,
          type: updates.type || additionalRooms[roomIndex].type,
          generalCondition: updates.generalCondition !== undefined ? updates.generalCondition : additionalRooms[roomIndex].generalCondition,
          components: updates.components || additionalRooms[roomIndex].components || []
        };
        
        // Update the room type in the rooms table if needed
        if (updates.type) {
          await supabase
            .from('rooms')
            .update({ type: updates.type })
            .eq('id', roomId);
        }
        
        // Update the inspection with the updated additional rooms
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              additionalRooms: additionalRooms
            }
          })
          .eq('id', reportId);
        
        // Get images for the room
        const { data: imageData } = await supabase
          .from('inspection_images')
          .select('*')
          .eq('inspection_id', reportId);
          
        const roomImages = (imageData || []).filter(img => 
          img.image_url.includes(`/${roomId}/`) || 
          (updates.components && updates.components.some(comp => 
            comp.images.some(image => image.url === img.image_url)
          ))
        ).map(img => ({
          id: img.id,
          url: img.image_url,
          timestamp: new Date(img.created_at),
          aiProcessed: img.analysis !== null,
          aiData: img.analysis
        }));
        
        // Return the updated room
        return {
          id: roomId,
          name: additionalRooms[roomIndex].name,
          type: additionalRooms[roomIndex].type as RoomType,
          order: updates.order || additionalRooms[roomIndex].order || roomIndex + 1,
          generalCondition: additionalRooms[roomIndex].generalCondition || '',
          sections: additionalRooms[roomIndex].sections || [],
          components: additionalRooms[roomIndex].components || [],
          images: roomImages
        };
      }
    } catch (error) {
      console.error("Error updating room:", error);
      return null;
    }
  },
  
  addImageToRoom: async (reportId: string, roomId: string, imageUrl: string): Promise<RoomImage | null> => {
    // For our schema, images are associated with inspections, not rooms directly
    
    try {
      // Store the image in Supabase Storage if it's a data URL
      let finalImageUrl = imageUrl;
      
      if (imageUrl.startsWith('data:')) {
        finalImageUrl = await uploadReportImage(imageUrl, reportId, roomId);
      }
      
      const imageId = uuidv4();
      
      // Save the image URL to the database
      const { data, error } = await supabase
        .from('inspection_images')
        .insert({
          id: imageId,
          inspection_id: reportId,
          image_url: finalImageUrl
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
    } catch (error) {
      console.error("Error adding image to room:", error);
      return null;
    }
  },
  
  deleteRoom: async (reportId: string, roomId: string): Promise<void> => {
    try {
      // Get the inspection first
      const { data: inspection } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', reportId)
        .single();
        
      if (!inspection) {
        console.error("Inspection not found:", reportId);
        return;
      }
      
      // Check if this is the main room
      if (inspection.room_id === roomId) {
        // Can't delete the main room, just clear its data
        const reportInfo = inspection.report_info ? 
          (typeof inspection.report_info === 'string' 
            ? JSON.parse(inspection.report_info) 
            : inspection.report_info) as Record<string, any> 
          : {};
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              generalCondition: '',
              components: []
            }
          })
          .eq('id', reportId);
      } else {
        // Remove the room from additionalRooms
        const reportInfo = inspection.report_info ? 
          (typeof inspection.report_info === 'string' 
            ? JSON.parse(inspection.report_info) 
            : inspection.report_info) as Record<string, any> 
          : {};
          
        let additionalRooms = Array.isArray(reportInfo.additionalRooms) 
          ? reportInfo.additionalRooms 
          : [];
        
        additionalRooms = additionalRooms.filter((room: any) => room.id !== roomId);
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              additionalRooms: additionalRooms
            }
          })
          .eq('id', reportId);
          
        // Delete the actual room record
        await supabase
          .from('rooms')
          .delete()
          .eq('id', roomId);
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  },
  
  updateComponentAnalysis: async (
    reportId: string, 
    roomId: string, 
    componentId: string, 
    analysis: any,
    imageUrls: string[]
  ): Promise<boolean> => {
    try {
      // Get the inspection
      const { data: inspection } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', reportId)
        .single();
      
      if (!inspection) {
        console.error("Inspection not found:", reportId);
        return false;
      }
      
      // Check if this is the main room or an additional room
      const isMainRoom = inspection.room_id === roomId;
      const reportInfo = inspection.report_info ? 
        (typeof inspection.report_info === 'string' 
          ? JSON.parse(inspection.report_info) 
          : inspection.report_info) as Record<string, any> 
        : {};
      
      if (isMainRoom) {
        // Update component in main room
        const components = Array.isArray(reportInfo.components) 
          ? reportInfo.components 
          : [];
          
        const updatedComponents = components.map((comp: any) => {
          if (comp.id === componentId) {
            return {
              ...comp,
              analysis,
              images: [...(comp.images || []), ...imageUrls.map((url: string) => ({
                id: uuidv4(),
                url,
                timestamp: new Date(),
                aiProcessed: true,
                aiData: analysis
              }))]
            };
          }
          return comp;
        });
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              components: updatedComponents
            }
          })
          .eq('id', reportId);
      } else {
        // Update component in additional room
        const additionalRooms = Array.isArray(reportInfo.additionalRooms) 
          ? reportInfo.additionalRooms 
          : [];
          
        const roomIndex = additionalRooms.findIndex((room: any) => room.id === roomId);
        
        if (roomIndex === -1) {
          console.error("Room not found in additional rooms:", roomId);
          return false;
        }
        
        const room = additionalRooms[roomIndex];
        const components = Array.isArray(room.components) 
          ? room.components 
          : [];
        
        const updatedComponents = components.map((comp: any) => {
          if (comp.id === componentId) {
            return {
              ...comp,
              analysis,
              images: [...(comp.images || []), ...imageUrls.map((url: string) => ({
                id: uuidv4(),
                url,
                timestamp: new Date(),
                aiProcessed: true,
                aiData: analysis
              }))]
            };
          }
          return comp;
        });
        
        additionalRooms[roomIndex] = {
          ...room,
          components: updatedComponents
        };
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              additionalRooms
            }
          })
          .eq('id', reportId);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating component analysis:", error);
      return false;
    }
  }
};
