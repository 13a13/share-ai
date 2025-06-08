
import { supabase } from '@/integrations/supabase/client';
import { Report } from '@/types';

/**
 * Highly optimized dashboard API with minimal queries and proper joins
 */
export const OptimizedDashboardAPI = {
  /**
   * Get dashboard data with a single optimized query
   */
  getDashboardData: async (): Promise<{
    properties: any[];
    reports: Report[];
  }> => {
    try {
      // Single query to get recent inspections with all needed data
      // Fix: Use proper foreign key syntax for Supabase
      const { data: inspections, error } = await supabase
        .from('inspections')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          report_info,
          room_id,
          rooms!inspections_room_id_fkey(
            id,
            property_id,
            type,
            properties!rooms_property_id_fkey(
              id,
              name,
              location,
              type,
              image_url,
              created_at,
              updated_at
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching dashboard data:', error);
        return { properties: [], reports: [] };
      }

      if (!inspections || inspections.length === 0) {
        return { properties: [], reports: [] };
      }

      const reports: Report[] = [];
      const propertiesMap = new Map();

      // Process inspections and extract unique properties
      inspections.forEach((inspection) => {
        const room = inspection.rooms;
        const property = room?.properties;
        
        if (!property) return;

        // Add property to map if not already present
        if (!propertiesMap.has(property.id)) {
          propertiesMap.set(property.id, {
            id: property.id,
            name: property.name,
            address: property.location,
            city: '',
            state: '',
            zipCode: '',
            propertyType: property.type as any,
            bedrooms: 0,
            bathrooms: 0,
            squareFeet: 0,
            imageUrl: property.image_url,
            createdAt: new Date(property.created_at),
            updatedAt: new Date(property.updated_at)
          });
        }

        // Parse report info
        let reportName = `${property.name} Inspection`;
        try {
          if (inspection.report_info) {
            const reportInfo = typeof inspection.report_info === 'string' 
              ? JSON.parse(inspection.report_info) 
              : inspection.report_info;
            if (reportInfo.name) {
              reportName = reportInfo.name;
            }
          }
        } catch (e) {
          // Keep default name
        }

        reports.push({
          id: inspection.id,
          name: reportName,
          propertyId: property.id,
          type: 'inspection' as const,
          status: inspection.status as any,
          createdAt: new Date(inspection.created_at),
          updatedAt: new Date(inspection.updated_at),
          completedAt: null,
          rooms: [],
          property: propertiesMap.get(property.id)
        });
      });

      return {
        properties: Array.from(propertiesMap.values()).slice(0, 3),
        reports: reports.slice(0, 3)
      };
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      return { properties: [], reports: [] };
    }
  }
};
