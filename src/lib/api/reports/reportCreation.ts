
import { Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { transformInspectionToReport } from './reportTransformers';

/**
 * Creates a new report
 */
export const createReport = async (propertyId: string, type: string): Promise<Report | null> => {
  try {
    console.log(`Creating new report for property ${propertyId} of type ${type}`);
    
    // Create a new room for the report
    const roomId = crypto.randomUUID();
    
    const { error: roomError } = await supabase.from('rooms').insert({
      id: roomId,
      property_id: propertyId,
      type: 'living_room' // Default room type
    });
    
    if (roomError) {
      console.error('Error creating room:', roomError);
      throw roomError;
    }
    
    // Create a new inspection
    const reportId = crypto.randomUUID();
    
    // Store the report type in the report_info
    const reportInfo = {
      reportDate: new Date().toISOString(),
      clerk: 'Inspector',
      sections: [],
      components: [],
      reportType: type // Store the report type here
    };
    
    const { error: inspectionError } = await supabase.from('inspections').insert({
      id: reportId,
      room_id: roomId,
      status: 'draft',
      report_info: JSON.stringify(reportInfo)
    });
    
    if (inspectionError) {
      console.error('Error creating inspection:', inspectionError);
      throw inspectionError;
    }
    
    // Get the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
      
    if (propertyError || !property) {
      console.error('Property not found:', propertyId, propertyError);
      throw new Error(`Property not found: ${propertyId}`);
    }
    
    // Get the room
    const { data: room, error: roomFetchError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (roomFetchError || !room) {
      console.error('Room not found after creation:', roomId, roomFetchError);
      throw new Error('Failed to retrieve created room');
    }
    
    // Get the inspection
    const { data: inspection, error: inspectionFetchError } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', reportId)
      .single();
      
    if (inspectionFetchError || !inspection) {
      console.error('Inspection not found after creation:', reportId, inspectionFetchError);
      throw new Error('Failed to retrieve created inspection');
    }
    
    // Transform to client format, but don't include the placeholder room in the rooms array
    const report = transformInspectionToReport(inspection, room, property);
    report.rooms = []; // Clear the default room from the UI display
    console.log('Created report with empty rooms array:', report);
    return report;
  } catch (error) {
    console.error('Error creating report:', error);
    return null;
  }
};
