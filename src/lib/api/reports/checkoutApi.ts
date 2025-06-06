
import { supabase } from '@/integrations/supabase/client';
import { Report } from '@/types';

export interface CheckoutComparison {
  id: string;
  checkout_report_id: string;
  checkin_report_id: string;
  room_id: string;
  component_id: string;
  component_name: string;
  status: 'unchanged' | 'changed' | 'pending';
  change_description?: string;
  checkout_condition?: string;
  checkout_images?: string[];
  ai_analysis?: any;
  created_at: string;
  updated_at: string;
}

export interface CheckoutData {
  clerk?: string;
  tenantName?: string;
  tenantPresent?: boolean;
  date?: string;
}

/**
 * Checkout API for handling checkout procedures
 */
export const CheckoutAPI = {
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
   * Get checkout comparisons for a checkout report
   */
  async getCheckoutComparisons(checkoutReportId: string): Promise<CheckoutComparison[]> {
    try {
      const { data, error } = await supabase
        .from('checkout_comparisons')
        .select('*')
        .eq('checkout_report_id', checkoutReportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching checkout comparisons:', error);
        throw error;
      }

      // Cast the data to ensure proper typing
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'unchanged' | 'changed' | 'pending'
      }));
    } catch (error) {
      console.error('Error in getCheckoutComparisons:', error);
      throw error;
    }
  },

  /**
   * Initialize checkout comparisons for all components in a check-in report
   */
  async initializeCheckoutComparisons(checkoutReportId: string, checkinReportId: string, components: any[]): Promise<void> {
    try {
      console.log('Initializing checkout comparisons:', { checkoutReportId, checkinReportId, componentsCount: components.length });
      
      const comparisons = components.map(component => ({
        checkout_report_id: checkoutReportId,
        checkin_report_id: checkinReportId,
        room_id: component.roomId || '',
        component_id: component.id,
        component_name: component.name,
        status: 'pending' as const
      }));

      const { error } = await supabase
        .from('checkout_comparisons')
        .insert(comparisons);

      if (error) {
        console.error('Error initializing checkout comparisons:', error);
        throw error;
      }

      console.log('Checkout comparisons initialized successfully');
    } catch (error) {
      console.error('Error in initializeCheckoutComparisons:', error);
      throw error;
    }
  },

  /**
   * Update a checkout comparison
   */
  async updateCheckoutComparison(
    comparisonId: string, 
    updates: Partial<CheckoutComparison>
  ): Promise<CheckoutComparison | null> {
    try {
      const { data, error } = await supabase
        .from('checkout_comparisons')
        .update(updates)
        .eq('id', comparisonId)
        .select()
        .single();

      if (error) {
        console.error('Error updating checkout comparison:', error);
        throw error;
      }

      // Cast the data to ensure proper typing
      return data ? {
        ...data,
        status: data.status as 'unchanged' | 'changed' | 'pending'
      } : null;
    } catch (error) {
      console.error('Error in updateCheckoutComparison:', error);
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
