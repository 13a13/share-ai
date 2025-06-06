
import { supabase } from '@/integrations/supabase/client';
import { Report } from '@/types';
import { CheckoutData } from './checkoutTypes';

/**
 * Checkout Report API for handling checkout report creation and management
 */
export const CheckoutReportAPI = {
  /**
   * Create a checkout report from an existing check-in report
   */
  async createCheckoutReport(checkinReportId: string, checkoutData: CheckoutData): Promise<Report | null> {
    try {
      console.log('Creating checkout report for:', checkinReportId);
      
      // First, get the check-in report data
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select(`
          *,
          rooms (
            id,
            type,
            property_id,
            properties (*)
          )
        `)
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report:', fetchError);
        throw fetchError;
      }

      if (!checkinReport) {
        throw new Error('Check-in report not found');
      }

      // Create the checkout inspection record
      const { data: checkoutInspection, error: createError } = await supabase
        .from('inspections')
        .insert({
          room_id: checkinReport.room_id,
          is_checkout: true,
          checkout_report_id: checkinReportId,
          checkout_date: checkoutData.date || new Date().toISOString(),
          checkout_clerk: checkoutData.clerk,
          checkout_tenant_name: checkoutData.tenantName,
          checkout_tenant_present: checkoutData.tenantPresent,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating checkout report:', createError);
        throw createError;
      }

      // Update the check-in report to reference the checkout report
      await supabase
        .from('inspections')
        .update({ checkout_report_id: checkoutInspection.id })
        .eq('id', checkinReportId);

      console.log('Checkout report created:', checkoutInspection);
      return checkoutInspection as any;
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
