
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

      // Parse current report info
      let reportInfo;
      try {
        reportInfo = inspection.report_info ? JSON.parse(inspection.report_info) : {};
      } catch (e) {
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
      // Get recent inspections with basic info only
      const { data: inspections, error } = await supabase
        .from('inspections')
        .select(`
          id,
          name,
          status,
          created_at,
          updated_at,
          room_id
        `)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching dashboard reports:', error);
        return [];
      }
      
      const reports: Report[] = [];
      
      // Process each inspection with minimal queries
      for (const inspection of inspections) {
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
        
        reports.push({
          id: inspection.id,
          name: inspection.name || `${property.name} Inspection`,
          propertyId: room.property_id,
          propertyName: property.name,
          propertyAddress: property.location,
          status: inspection.status as any,
          createdAt: inspection.created_at,
          updatedAt: inspection.updated_at,
          rooms: [], // Empty for dashboard view
          property: {
            id: room.property_id,
            name: property.name,
            address: property.location
          } as any
        });
      }
      
      return reports;
    } catch (error) {
      console.error('Error in getDashboardReports:', error);
      return [];
    }
  }
};
