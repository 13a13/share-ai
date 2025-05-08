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
    const reportInfoData = inspectionData.report_info ? inspectionData.report_info as Record<string, any> : {};
    
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
        name: room.type as string, // Using room.type as name since name doesn't exist in the schema
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
        ? existingReport.report_info as Record<string, any> 
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
        .select('room_id')
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
        name: name
      });
      
      console.log(`Created new room with ID: ${roomId}`);
      
      // Return the room in our client format
      return {
        id: roomId,
        name: name,
        type: type,
        order: 1,
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
      // Update the room type and name
      if (updates.type || updates.name) {
        await supabase
          .from('rooms')
          .update({ 
            type: updates.type,
            name: updates.name
          })
          .eq('id', roomId);
      
        console.log(`Updated room name to "${updates.name}" and type to "${updates.type}"`);
      }
    
      // Get the room
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
    
      if (!room) {
        console.error("Room not found:", roomId);
        return null;
      }
    
      // Get the inspection for this room
      const { data: inspection } = await supabase
        .from('inspections')
        .select('id, report_info')
        .eq('room_id', roomId)
        .single();
    
      if (!inspection) {
        // Check if we need to create a new inspection for this room
        // This is needed for additional rooms that were added
        console.log("No inspection found for room, creating new inspection:", roomId);
        
        const { data: newInspection, error: newInspectionError } = await supabase
          .from('inspections')
          .insert({
            id: uuidv4(),
            room_id: roomId,
            status: 'in_progress',
            report_info: {}
          })
          .select()
          .single();
          
        if (newInspectionError) {
          console.error("Error creating inspection for room:", newInspectionError);
          return null;
        }
        
        // Save the report_info with components and general condition
        if (updates.components || updates.generalCondition) {
          const reportInfo: Record<string, any> = {};
          
          if (updates.generalCondition) {
            reportInfo.generalCondition = updates.generalCondition;
          }
          
          if (updates.components) {
            reportInfo.components = JSON.parse(JSON.stringify(updates.components));
          }
          
          await supabase
            .from('inspections')
            .update({
              report_info: reportInfo
            })
            .eq('id', newInspection.id);
            
          console.log("Created new inspection with components for room:", roomId);
        }
      } else {
        // Handle existing inspection
        // Get current components from report_info or use empty array
        const reportInfo = inspection.report_info ? inspection.report_info as Record<string, any> : {};
        
        // Save the report_info with components data if it exists
        if (updates.components || updates.generalCondition) {
          const updatedReportInfo: Record<string, any> = {
            ...((inspection.report_info && typeof inspection.report_info === 'object') ? 
              inspection.report_info as Record<string, any> : {})
          };
          
          if (updates.generalCondition !== undefined) {
            updatedReportInfo.generalCondition = updates.generalCondition;
          }
          
          if (updates.components) {
            // Serialize the components before storing them in the report_info JSON field
            updatedReportInfo.components = JSON.parse(JSON.stringify(updates.components));
          }
          
          await supabase
            .from('inspections')
            .update({
              report_info: updatedReportInfo
            })
            .eq('id', inspection.id);
            
          console.log("Updated existing inspection with components for room:", roomId);
        }
      }
    
      // Get images for the room via inspection
      const { data: imageData } = await supabase
        .from('inspection_images')
        .select('*')
        .eq('inspection_id', reportId);
    
      const roomImages = (imageData || []).filter(img => {
        // Process image URLs to identify which ones belong to this room
        const belongsToRoom = img.image_url.includes(`/${roomId}/`) || 
          (updates.components && updates.components.some(comp => 
            comp.images.some(image => image.url === img.image_url)
          ));
        return belongsToRoom;
      });
    
      // Return the room in our client format
      // The type assertion is necessary because the room from Supabase doesn't have all the fields
      // our Room type expects
      const roomType = room.type as string;
      
      return {
        id: room.id,
        name: room.type as string, // Use type as the name since 'name' doesn't exist in the schema
        type: roomType as RoomType,
        order: updates.order || 1,
        generalCondition: updates.generalCondition || '',
        sections: updates.sections || [],
        components: updates.components || [],
        images: roomImages.map(img => ({
          id: img.id,
          url: img.image_url,
          timestamp: new Date(img.created_at),
          aiProcessed: img.analysis !== null,
          aiData: img.analysis
        }))
      };
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
    // In our schema, deleting a room means deleting the inspection
    await ReportsAPI.delete(reportId);
  },
  
  updateComponentAnalysis: async (
    reportId: string, 
    roomId: string, 
    componentId: string, 
    analysis: any,
    imageUrls: string[]
  ): Promise<boolean> => {
    try {
      // Get the inspection for this room
      const { data: inspection } = await supabase
        .from('inspections')
        .select('id, report_info')
        .eq('room_id', roomId)
        .single();
      
      if (!inspection) return false;

      // Get current components from report_info or use empty array
      const reportInfoData = inspection.report_info ? inspection.report_info as Record<string, any> : {};
      const currentComponents = reportInfoData && reportInfoData.components ? reportInfoData.components : [];
      
      // Update the component with the new analysis
      const updatedComponents = currentComponents.map(component => {
        if (component.id === componentId) {
          return {
            ...component,
            analysis,
            images: [...(component.images || []), ...imageUrls.map(url => ({
              id: uuidv4(),
              url,
              timestamp: new Date(),
              aiProcessed: true,
              aiData: analysis
            }))]
          };
        }
        return component;
      });
      
      // FIX: Serialize the components before storing them in the report_info JSON field
      const serializableComponents = JSON.parse(JSON.stringify(updatedComponents));
      
      // Update inspection with components in the report_info column
      await supabase
        .from('inspections')
        .update({
          report_info: {
            ...((inspection.report_info && typeof inspection.report_info === 'object') ? 
              inspection.report_info as Record<string, any> : {}),
            components: serializableComponents
          }
        })
        .eq('id', inspection.id);
      
      return true;
    } catch (error) {
      console.error("Error updating component analysis:", error);
      return false;
    }
  }
};
