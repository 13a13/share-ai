
import { supabase } from '@/integrations/supabase/client';
import { CheckoutData } from './checkoutTypes';
import { CheckoutComparisonAPI } from './checkoutComparisonApi';
import { CheckoutComponentExtractor } from './checkoutComponentExtractor';
import { ReportUpdateAPI } from './reportUpdateApi';
import { parseReportInfo } from './reportTransformers';

/**
 * Checkout Operations Service
 * Handles core checkout report operations - now saves within check-in report
 */
export const CheckoutOperations = {
  /**
   * Phase 2: Start checkout session and save data within check-in report
   */
  async createBasicCheckoutReport(checkinReportId: string, checkoutData: CheckoutData): Promise<any> {
    try {
      console.log('Starting checkout session for check-in report:', checkinReportId);
      
      // Fetch the check-in report to get existing data
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report:', fetchError);
        throw fetchError;
      }

      // Parse existing report info
      const reportInfo = parseReportInfo(checkinReport.report_info);

      // Create checkout data structure
      const checkoutSession = {
        id: `checkout-${checkinReportId}`, // Virtual ID for consistency
        checkout_clerk: checkoutData.clerk || '',
        checkout_tenant_name: checkoutData.tenantName || '',
        checkout_tenant_present: checkoutData.tenantPresent || false,
        checkout_date: checkoutData.date || new Date().toISOString(),
        status: 'in_progress',
        started_at: new Date().toISOString(),
        room_id: checkinReport.room_id,
        checkin_report_id: checkinReportId
      };

      // Save checkout session data within check-in report
      const updatedReportInfo = {
        ...reportInfo,
        checkout_session: checkoutSession
      };

      // Update the check-in report with checkout session data
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          report_info: updatedReportInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkinReportId);

      if (updateError) {
        console.error('Error saving checkout session:', updateError);
        throw updateError;
      }

      console.log('Checkout session started successfully within check-in report');
      return checkoutSession;
    } catch (error) {
      console.error('Error in createBasicCheckoutReport:', error);
      throw error;
    }
  },

  /**
   * Phase 3: Initialize component comparisons for checkout session
   */
  async initializeComponentComparisons(checkoutSessionId: string, checkinReportId: string): Promise<any[]> {
    try {
      console.log('Initializing component comparisons for checkout session:', checkoutSessionId);
      
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

      // Use enhanced component extraction with STRICT filtering
      const allComponents = CheckoutComponentExtractor.extractComponentsFromCheckinReport(checkinReport.report_info);

      console.log('STRICT filtering extraction found valid components:', allComponents.length);

      // If no valid components found after strict filtering, create a general assessment component
      if (allComponents.length === 0) {
        console.warn('No valid components found in check-in report after strict filtering (missing photos AND descriptions), creating general assessment');
        const fallbackComponent = CheckoutComponentExtractor.createFallbackComponent();
        allComponents.push(fallbackComponent);
      } else {
        console.log(`Successfully found ${allComponents.length} components with both description and images for checkout assessment`);
      }

      // Parse existing report info
      const reportInfo = parseReportInfo(checkinReport.report_info);

      // Create comparison data structure to save within check-in report
      const comparisonData = allComponents.map(component => ({
        id: `comparison-${component.id}`,
        component_id: component.id,
        component_name: component.name,
        room_id: component.roomId,
        status: 'pending',
        checkin_data: component.checkinData,
        checkout_images: [],
        ai_analysis: {},
        change_description: null,
        checkout_condition: null
      }));

      // Save comparison data within check-in report
      const updatedReportInfo = {
        ...reportInfo,
        checkout_session: {
          ...reportInfo.checkout_session,
          comparisons: comparisonData,
          components_initialized: true,
          total_components: allComponents.length
        }
      };

      // Update the check-in report with comparison data
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          report_info: updatedReportInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkinReportId);

      if (updateError) {
        console.error('Error saving checkout comparisons:', updateError);
        throw updateError;
      }

      console.log(`Successfully initialized ${allComponents.length} component comparisons within check-in report`);
      return comparisonData;
    } catch (error) {
      console.error('Error in initializeComponentComparisons:', error);
      throw error;
    }
  },

  /**
   * Complete a checkout session
   */
  async completeCheckoutReport(checkinReportId: string): Promise<void> {
    try {
      // Fetch the check-in report
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report:', fetchError);
        throw fetchError;
      }

      const reportInfo = parseReportInfo(checkinReport.report_info);

      // Update checkout session status to completed
      const updatedReportInfo = {
        ...reportInfo,
        checkout_session: {
          ...reportInfo.checkout_session,
          status: 'completed',
          completed_at: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('inspections')
        .update({ 
          report_info: updatedReportInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkinReportId);

      if (error) {
        console.error('Error completing checkout session:', error);
        throw error;
      }

      console.log('Checkout session completed:', checkinReportId);
    } catch (error) {
      console.error('Error in completeCheckoutReport:', error);
      throw error;
    }
  }
};
