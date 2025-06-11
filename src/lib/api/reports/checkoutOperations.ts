
import { supabase } from '@/integrations/supabase/client';
import { CheckoutData } from './checkoutTypes';
import { CheckoutComparisonAPI } from './checkoutComparisonApi';
import { CheckoutComponentExtractor } from './checkoutComponentExtractor';

/**
 * Checkout Operations Service
 * Handles core checkout report operations with the new data flow
 */
export const CheckoutOperations = {
  /**
   * Create a completed checkout report (only called on final completion)
   */
  async createCompletedCheckoutReport(
    checkinReportId: string, 
    checkoutData: CheckoutData, 
    assessmentData: any[]
  ): Promise<any> {
    try {
      console.log('Creating completed checkout report for:', checkinReportId);
      
      // First, fetch the check-in report to get the room_id and property info
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

      // Get property info from the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('property_id')
        .eq('id', checkinReport.room_id)
        .single();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        throw roomError;
      }

      // Prepare JSON-compatible data for the report_info field
      const reportInfo = {
        checkoutData: {
          clerk: checkoutData.clerk || '',
          tenantName: checkoutData.tenantName || '',
          tenantPresent: checkoutData.tenantPresent || false,
          date: checkoutData.date || new Date().toISOString()
        },
        assessmentData: assessmentData || [],
        completedAt: new Date().toISOString(),
        propertyId: room.property_id,
        checkinReportId: checkinReportId
      };

      // Create the checkout inspection record
      const { data: checkoutInspection, error: createError } = await supabase
        .from('inspections')
        .insert({
          room_id: checkinReport.room_id,
          is_checkout: true,
          checkout_report_id: checkinReportId,
          checkout_date: checkoutData.date || new Date().toISOString(),
          checkout_clerk: checkoutData.clerk || '',
          checkout_tenant_name: checkoutData.tenantName || '',
          checkout_tenant_present: checkoutData.tenantPresent || false,
          status: 'completed',
          report_info: reportInfo
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating checkout report:', createError);
        throw createError;
      }

      // Update the check-in report to reference the new checkout report
      const existingReportInfo = checkinReport.report_info as Record<string, any> || {};
      const updatedCheckinInfo = {
        ...existingReportInfo,
        checkoutReportId: checkoutInspection.id,
        hasCheckout: true
      };

      const { error: updateError } = await supabase
        .from('inspections')
        .update({ report_info: updatedCheckinInfo })
        .eq('id', checkinReportId);

      if (updateError) {
        console.error('Error updating check-in report:', updateError);
        // Don't throw here as the checkout was created successfully
      }

      console.log('Completed checkout report created successfully:', checkoutInspection);
      return checkoutInspection;
    } catch (error) {
      console.error('Error in createCompletedCheckoutReport:', error);
      throw error;
    }
  },

  /**
   * Save checkout draft/in-progress data (optional feature)
   */
  async saveDraftCheckout(checkinReportId: string, draftData: any): Promise<void> {
    try {
      // Save draft data to local storage or optionally to backend
      const draftKey = `checkout_draft_${checkinReportId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        ...draftData,
        lastSaved: new Date().toISOString()
      }));
      
      console.log('Draft checkout data saved:', draftKey);
    } catch (error) {
      console.error('Error saving draft checkout:', error);
    }
  },

  /**
   * Load checkout draft data
   */
  async loadDraftCheckout(checkinReportId: string): Promise<any | null> {
    try {
      const draftKey = `checkout_draft_${checkinReportId}`;
      const draftData = localStorage.getItem(draftKey);
      
      if (draftData) {
        const parsed = JSON.parse(draftData);
        console.log('Loaded draft checkout data:', parsed);
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading draft checkout:', error);
      return null;
    }
  },

  /**
   * Clear checkout draft data
   */
  async clearDraftCheckout(checkinReportId: string): Promise<void> {
    try {
      const draftKey = `checkout_draft_${checkinReportId}`;
      localStorage.removeItem(draftKey);
      console.log('Draft checkout data cleared:', draftKey);
    } catch (error) {
      console.error('Error clearing draft checkout:', error);
    }
  },

  /**
   * Extract components for checkout assessment (preparation only)
   */
  async prepareCheckoutComponents(checkinReportId: string): Promise<any[]> {
    try {
      console.log('Preparing checkout components for:', checkinReportId);
      
      // Fetch the check-in report to get all components
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report for components:', fetchError);
        throw fetchError;
      }

      // Extract components using the existing extractor
      const components = CheckoutComponentExtractor.extractComponentsFromCheckinReport(checkinReport.report_info || {});

      console.log(`Prepared ${components.length} components for checkout assessment`);
      return components;
    } catch (error) {
      console.error('Error in prepareCheckoutComponents:', error);
      throw error;
    }
  }
};
