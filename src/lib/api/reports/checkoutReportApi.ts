
import { supabase } from '@/integrations/supabase/client';
import { CheckoutData } from './checkoutTypes';

/**
 * Simple Checkout Report API - Step 1 Implementation
 */
export const CheckoutReportAPI = {
  /**
   * Create a basic checkout report
   */
  async createCheckoutReport(checkinReportId: string, checkoutData: CheckoutData): Promise<any> {
    try {
      console.log('Creating simple checkout report for:', checkinReportId);
      console.log('Checkout data:', checkoutData);
      
      // Create a simple checkout inspection record
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

      console.log('Simple checkout report created:', checkoutInspection);
      return checkoutInspection;
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
