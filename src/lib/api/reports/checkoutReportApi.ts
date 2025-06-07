
import { supabase } from '@/integrations/supabase/client';
import { CheckoutData } from './checkoutTypes';
import { CheckoutComparisonAPI } from './checkoutComparisonApi';

/**
 * Checkout Report API - Fixed Implementation
 */
export const CheckoutReportAPI = {
  /**
   * Phase 2: Create a basic checkout report
   */
  async createBasicCheckoutReport(checkinReportId: string, checkoutData: CheckoutData): Promise<any> {
    try {
      console.log('Creating basic checkout report for:', checkinReportId);
      console.log('Checkout data:', checkoutData);
      
      // First, fetch the check-in report to get the room_id
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report:', fetchError);
        throw fetchError;
      }

      if (!checkinReport.room_id) {
        throw new Error('Check-in report does not have a valid room_id');
      }

      // Create the checkout inspection record with the same room_id as check-in
      const { data: checkoutInspection, error: createError } = await supabase
        .from('inspections')
        .insert({
          room_id: checkinReport.room_id, // Use the same room_id from check-in
          is_checkout: true,
          checkout_report_id: checkinReportId,
          checkout_date: checkoutData.date || new Date().toISOString(),
          checkout_clerk: checkoutData.clerk || '',
          checkout_tenant_name: checkoutData.tenantName || '',
          checkout_tenant_present: checkoutData.tenantPresent || false,
          status: 'in_progress'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating checkout report:', createError);
        throw createError;
      }

      console.log('Basic checkout report created successfully:', checkoutInspection);
      return checkoutInspection;
    } catch (error) {
      console.error('Error in createBasicCheckoutReport:', error);
      throw error;
    }
  },

  /**
   * Phase 3: Initialize component comparisons for existing checkout
   */
  async initializeComponentComparisons(checkoutReportId: string, checkinReportId: string): Promise<any[]> {
    try {
      console.log('Initializing component comparisons for checkout:', checkoutReportId);
      
      // Fetch the check-in report to get all components and room_id
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report for components:', fetchError);
        throw fetchError;
      }

      console.log('Raw check-in report data:', checkinReport);

      // Extract components from the check-in report with improved logic
      const reportInfo = checkinReport.report_info as any;
      console.log('Report info structure:', reportInfo);
      
      const allComponents: any[] = [];

      // Handle different possible data structures
      if (reportInfo) {
        // Check if there's a rooms array directly in reportInfo
        if (reportInfo.rooms && Array.isArray(reportInfo.rooms)) {
          console.log('Found rooms array with length:', reportInfo.rooms.length);
          reportInfo.rooms.forEach((room: any, roomIndex: number) => {
            console.log(`Processing room ${roomIndex}:`, room);
            
            if (room.components && Array.isArray(room.components)) {
              console.log(`Room ${room.name || room.id || roomIndex} has ${room.components.length} components`);
              
              room.components.forEach((component: any) => {
                const componentData = {
                  id: component.id || `${room.id || roomIndex}-${component.name}`,
                  name: component.name || 'Unknown Component',
                  roomId: room.id || `room-${roomIndex}`,
                  roomName: room.name || room.type || `Room ${roomIndex + 1}`,
                  condition: component.condition || 'unknown',
                  images: component.images || [],
                  notes: component.notes || component.description || '',
                  description: component.description || '',
                  conditionSummary: component.conditionSummary || ''
                };
                
                console.log('Adding component:', componentData);
                allComponents.push(componentData);
              });
            } else {
              console.log(`Room ${room.name || roomIndex} has no components or components is not an array`);
            }
          });
        }
        
        // Also check for components at the top level (in case the structure is different)
        if (reportInfo.components && Array.isArray(reportInfo.components)) {
          console.log('Found top-level components array with length:', reportInfo.components.length);
          reportInfo.components.forEach((component: any) => {
            const componentData = {
              id: component.id || component.name,
              name: component.name || 'Unknown Component',
              roomId: component.roomId || 'general',
              roomName: component.roomName || 'General',
              condition: component.condition || 'unknown',
              images: component.images || [],
              notes: component.notes || component.description || '',
              description: component.description || '',
              conditionSummary: component.conditionSummary || ''
            };
            
            console.log('Adding top-level component:', componentData);
            allComponents.push(componentData);
          });
        }
      }

      console.log('Total components found for comparison:', allComponents.length);
      console.log('All components:', allComponents);

      // Initialize comparison records for all components
      if (allComponents.length > 0) {
        await CheckoutComparisonAPI.initializeCheckoutComparisons(
          checkoutReportId,
          checkinReportId,
          allComponents
        );
      } else {
        console.warn('No components found in check-in report for initialization');
        // Let's try a different approach - fetch from the database directly
        console.log('Attempting alternative component extraction...');
        
        // Try to get components from the property/room structure if available
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', checkinReport.room_id || 'unknown')
          .single();
          
        if (roomData && !roomError) {
          console.log('Found room data:', roomData);
          // You could add logic here to extract components from room data if needed
        }
      }

      return allComponents;
    } catch (error) {
      console.error('Error in initializeComponentComparisons:', error);
      throw error;
    }
  },

  /**
   * Complete a checkout report
   */
  async completeCheckoutReport(checkoutReportId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', checkoutReportId);

      if (error) {
        console.error('Error completing checkout report:', error);
        throw error;
      }

      console.log('Checkout report completed:', checkoutReportId);
    } catch (error) {
      console.error('Error in completeCheckoutReport:', error);
      throw error;
    }
  }
};
