
import { Report, Room, RoomType, RoomImage } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// This is an extension for the getById method in ReportsAPI
// Since the full file is too long to include, just add this 
// to the getById method in reportsApi.ts

const getById = async (id: string): Promise<Report | null> => {
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
  const components = reportInfoData.components || [];
    
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
      name: room.name || room.type,
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
  
  console.log("Loaded report with components:", components.length);
  
  return report;
};

export { getById };
