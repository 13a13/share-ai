
import { supabase } from '@/integrations/supabase/client';
import { CheckoutData } from './checkoutTypes';
import { CheckoutComparisonAPI } from './checkoutComparisonApi';

/**
 * Checkout Report API - Step 2 Implementation
 */
export const CheckoutReportAPI = {
  /**
   * Create a checkout report with component comparisons
   */
  async createCheckoutReport(checkinReportId: string, checkoutData: CheckoutData): Promise<any> {
    try {
      console.log('Creating checkout report for:', checkinReportId);
      console.log('Checkout data:', checkoutData);
      
      // First, fetch the check-in report to get all components
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('*, report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report:', fetchError);
        throw fetchError;
      }

      // Create the checkout inspection record
      const { data: checkoutInspection, error: createError } = await supabase
        .from('inspections')
        .insert({
          room_id: '00000000-0000-0000-0000-000000000000', // Placeholder for now
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
              images: component.images || []
            });
          });
        }
      });

      console.log('Found components for comparison:', allComponents.length);

      // Initialize comparison records for all components
      if (allComponents.length > 0) {
        await CheckoutComparisonAPI.initializeCheckoutComparisons(
          checkoutInspection.id,
          checkinReportId,
          allComponents
        );
      }

      console.log('Checkout report created with comparisons:', checkoutInspection);
      return {
        ...checkoutInspection,
        componentsCount: allComponents.length
      };
    } catch (error) {
      console.error('Error in createCheckoutReport:', error);
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
