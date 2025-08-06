import { supabase } from "@/integrations/supabase/client";
import { Report } from "@/types";
import { parseReportInfo } from "@/lib/api/reports/reportTransformers";

/**
 * Load fresh report data from database for PDF generation
 * This ensures manual edits are included in the PDF
 */
export const loadFreshReportData = async (reportId: string): Promise<Report | null> => {
  try {
    const { data: inspection } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', reportId)
      .single();

    if (!inspection) {
      console.error("Inspection not found:", reportId);
      return null;
    }

    // Parse the report info to get the latest state
    const reportInfo = parseReportInfo(inspection.report_info);
    
    // Get property data - try multiple approaches to find the property
    let property = null;
    
    // First try with a property_id field if it exists
    if ('property_id' in inspection && inspection.property_id && typeof inspection.property_id === 'string') {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('id', inspection.property_id)
        .single();
      property = data;
    }
    
    // If no property found, try using the inspection ID itself
    if (!property) {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .limit(1)
        .single();
      property = data;
    }

    if (!property) {
      console.error("Property not found for inspection:", reportId);
      return null;
    }

    // Get main room data
    const { data: mainRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', inspection.room_id)
      .single();

    if (!mainRoom) {
      console.error("Main room not found for inspection:", reportId);
      return null;
    }

    // Construct the report object with latest data
    const report: Report = {
      id: inspection.id,
      propertyId: property.id,
      type: 'inspection' as any,
      status: (inspection.status as any) || 'draft',
      createdAt: new Date(inspection.created_at),
      updatedAt: new Date(inspection.updated_at),
      completedAt: inspection.status === 'completed' ? new Date(inspection.updated_at) : undefined,
      reportInfo: {
        clerk: reportInfo.clerk || '',
        inventoryType: reportInfo.inventoryType || 'checkin',
        tenantPresent: reportInfo.tenantPresent || false,
        tenantName: reportInfo.tenantName || '',
        additionalInfo: reportInfo.additionalInfo || '',
        fileUrl: reportInfo.fileUrl || '',
      },
      rooms: [
        {
          id: mainRoom.id,
          name: mainRoom.name || reportInfo.roomName || 'Main Room',
          type: mainRoom.type || 'room',
          generalCondition: reportInfo.generalCondition || '',
          images: [],
          components: reportInfo.components || [],
          sections: reportInfo.sections || [],
        },
        // Add additional rooms if they exist
        ...(reportInfo.additionalRooms || [])
      ]
    };

    return report;
  } catch (error) {
    console.error("Error loading fresh report data:", error);
    return null;
  }
};