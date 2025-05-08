
import { Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { parseReportInfo } from './reportTransformers';
import { BaseReportsAPI } from './baseReportsApi';

/**
 * API functions for updating reports
 */
export const ReportUpdateAPI = {
  /**
   * Update an existing report
   */
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
      
      // Initialize report info from existing or empty
      const reportInfo = parseReportInfo(existingReport?.report_info);
      
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
    return await BaseReportsAPI.getById(id);
  },
  
  /**
   * Delete a report
   */
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
  
  /**
   * Duplicate a report
   */
  duplicate: async (id: string): Promise<Report | null> => {
    const reportToDuplicate = await BaseReportsAPI.getById(id);
    
    if (!reportToDuplicate) return null;
    
    // Create a new report based on the existing one
    const newReport = await BaseReportsAPI.create(
      reportToDuplicate.propertyId, 
      'inspection'
    );
    
    return newReport;
  },
  
  /**
   * Update component analysis
   */
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
      const reportInfo = parseReportInfo(inspection.report_info);
      
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
                id: crypto.randomUUID(),
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
                id: crypto.randomUUID(),
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
