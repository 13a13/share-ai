
import { supabase } from '@/integrations/supabase/client';
import { CheckoutComparison } from './checkoutTypes';
import { transformCheckoutComparisons, transformCheckoutComparison } from './checkoutTransformers';

/**
 * Checkout Comparison API for handling comparison operations
 */
export const CheckoutComparisonAPI = {
  /**
   * Get checkout comparisons for a checkout report
   */
  async getCheckoutComparisons(checkoutReportId: string): Promise<CheckoutComparison[]> {
    try {
      console.log('Fetching checkout comparisons for report:', checkoutReportId);
      
      const { data, error } = await supabase
        .from('checkout_comparisons')
        .select('*')
        .eq('checkout_report_id', checkoutReportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching checkout comparisons:', error);
        throw error;
      }

      console.log('Raw comparison data from DB:', data);
      const transformedData = transformCheckoutComparisons(data || []);
      console.log('Transformed comparison data:', transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('Error in getCheckoutComparisons:', error);
      throw error;
    }
  },

  /**
   * Initialize checkout comparisons for all components in a check-in report
   * Now stores complete component data including check-in reference data
   */
  async initializeCheckoutComparisons(checkoutReportId: string, checkinReportId: string, components: any[]): Promise<void> {
    try {
      console.log('Initializing checkout comparisons:', { checkoutReportId, checkinReportId, componentsCount: components.length });
      
      if (components.length === 0) {
        console.warn('No components found to initialize comparisons');
        return;
      }
      
      const comparisons = components.map(component => ({
        checkout_report_id: checkoutReportId,
        checkin_report_id: checkinReportId,
        room_id: component.roomId || component.roomName || 'unknown',
        component_id: component.id,
        component_name: component.name,
        status: 'pending',
        // Store complete component data including check-in reference data
        ai_analysis: {
          // Check-in reference data
          checkinData: {
            originalCondition: component.condition,
            originalDescription: component.description,
            originalImages: component.images || [],
            originalNotes: component.notes || '',
            roomName: component.roomName,
            timestamp: component.checkinData?.timestamp || new Date().toISOString()
          },
          // Current component data for reference
          condition: component.condition,
          conditionSummary: component.conditionSummary || '',
          description: component.description,
          images: component.images || [],
          notes: component.notes || '',
          cleanliness: component.cleanliness || 'unknown',
          conditionPoints: component.conditionPoints || []
        }
      }));

      console.log('Inserting comparisons with complete data:', comparisons);

      const { error } = await supabase
        .from('checkout_comparisons')
        .insert(comparisons);

      if (error) {
        console.error('Error initializing checkout comparisons:', error);
        throw error;
      }

      console.log('Checkout comparisons initialized successfully with complete component data');
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

      return data ? transformCheckoutComparison(data) : null;
    } catch (error) {
      console.error('Error in updateCheckoutComparison:', error);
      throw error;
    }
  }
};
