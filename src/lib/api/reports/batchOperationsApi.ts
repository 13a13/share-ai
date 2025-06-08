import { supabase } from '@/integrations/supabase/client';
import { Report } from '@/types';

/**
 * Batch operations for reports to reduce API calls
 */
export const BatchReportsAPI = {
  /**
   * Update multiple components of a report in a single transaction
   */
  updateReportBatch: async (
    reportId: string, 
    updates: {
      generalCondition?: string;
      components?: any[];
      additionalData?: any;
    }
  ): Promise<boolean> => {
    try {
      // Get the current inspection
      const { data: inspection, error: fetchError } = await supabase
        .from('inspections')
        .select('report_info')
        .eq('id', reportId)
        .single();

      if (fetchError) {
        console.error('Error fetching inspection:', fetchError);
        return false;
      }

      // Parse current report info with proper type handling
      let reportInfo: any = {};
      try {
        if (inspection?.report_info && typeof inspection.report_info === 'string') {
          reportInfo = JSON.parse(inspection.report_info);
        } else if (inspection?.report_info && typeof inspection.report_info === 'object') {
          reportInfo = inspection.report_info;
        }
      } catch (e) {
        console.error('Error parsing report_info:', e);
        reportInfo = {};
      }

      // Merge updates
      if (updates.generalCondition) {
        reportInfo.generalCondition = updates.generalCondition;
      }
      
      if (updates.components) {
        if (!reportInfo.components) {
          reportInfo.components = [];
        }
        // Update or add components
        updates.components.forEach(newComponent => {
          const existingIndex = reportInfo.components.findIndex(
            (c: any) => c.id === newComponent.id
          );
          if (existingIndex >= 0) {
            reportInfo.components[existingIndex] = { ...reportInfo.components[existingIndex], ...newComponent };
          } else {
            reportInfo.components.push(newComponent);
          }
        });
      }

      if (updates.additionalData) {
        reportInfo = { ...reportInfo, ...updates.additionalData };
      }

      // Update in single operation
      const { error: updateError } = await supabase
        .from('inspections')
        .update({ 
          report_info: JSON.stringify(reportInfo),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) {
        console.error('Error updating inspection:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in batch update:', error);
      return false;
    }
  },

  /**
   * Get reports with minimal data for dashboard
   */
  getDashboardReports: async (): Promise<Report[]> => {
    try {
      // Get recent inspections with basic info only - using actual column names
      const { data: inspections, error } = await supabase
        .from('inspections')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          room_id,
          report_info
        `)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching dashboard reports:', error);
        return [];
      }
      
      if (!inspections || inspections.length === 0) {
        return [];
      }
      
      const reports: Report[] = [];
      
      // Process each inspection with minimal queries
      for (const inspection of inspections) {
        try {
          // Get room info
          const { data: room } = await supabase
            .from('rooms')
            .select('property_id, type')
            .eq('id', inspection.room_id)
            .single();
            
          if (!room) continue;
          
          // Get property name only
          const { data: property } = await supabase
            .from('properties')
            .select('name, location')
            .eq('id', room.property_id)
            .single();
            
          if (!property) continue;
          
          // Parse report info to get name if available
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
            // Keep default name if parsing fails
          }
          
          reports.push({
            id: inspection.id,
            name: reportName,
            propertyId: room.property_id,
            type: 'inspection' as const,
            status: inspection.status as any,
            createdAt: new Date(inspection.created_at),
            updatedAt: new Date(inspection.updated_at),
            completedAt: null,
            rooms: [], // Empty for dashboard view
            property: {
              id: room.property_id,
              name: property.name,
              address: property.location,
              city: '',
              state: '',
              zipCode: '',
              propertyType: 'house' as const,
              bedrooms: 0,
              bathrooms: 0,
              squareFeet: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        } catch (itemError) {
          console.error('Error processing inspection item:', itemError);
          continue;
        }
      }
      
      return reports;
    } catch (error) {
      console.error('Error in getDashboardReports:', error);
      return [];
    }
  }
};
