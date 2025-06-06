
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
      
      // Fetch the check-in report to get all components
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report for components:', fetchError);
        throw fetchError;
      }

      // Extract components from the check-in report
      const reportInfo = checkinReport.report_info as any;
      const rooms = reportInfo?.rooms || [];
      const allComponents: any[] = [];

      rooms.forEach((room: any) => {
        if (room.components) {
          room.components.forEach((component: any) => {
            allComponents.push({
              id: component.id,
              name: component.name,
              roomId: room.id,
              roomName: room.name,
              condition: component.condition,
              images: component.images || [],
              notes: component.notes || ''
            });
          });
        }
      });

      console.log('Found components for comparison:', allComponents.length);

      // Initialize comparison records for all components
      if (allComponents.length > 0) {
        await CheckoutComparisonAPI.initializeCheckoutComparisons(
          checkoutReportId,
          checkinReportId,
          allComponents
        );
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
