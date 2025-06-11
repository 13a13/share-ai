
import { CheckoutData } from './checkoutTypes';
import { CheckoutOperations } from './checkoutOperations';
import { CheckoutComponentExtractor } from './checkoutComponentExtractor';
import { supabase } from '@/integrations/supabase/client';
import { parseReportInfo } from './reportTransformers';

/**
 * Checkout Report API - Updated to work within check-in reports
 * Main API interface for checkout operations
 */
export const CheckoutReportAPI = {
  /**
   * Phase 2: Start checkout session within check-in report
   */
  async createBasicCheckoutReport(checkinReportId: string, checkoutData: CheckoutData): Promise<any> {
    return CheckoutOperations.createBasicCheckoutReport(checkinReportId, checkoutData);
  },

  /**
   * Phase 3: Initialize component comparisons for checkout session
   */
  async initializeComponentComparisons(checkoutSessionId: string, checkinReportId: string): Promise<any[]> {
    return CheckoutOperations.initializeComponentComparisons(checkoutSessionId, checkinReportId);
  },

  /**
   * Complete a checkout session
   */
  async completeCheckoutReport(checkinReportId: string): Promise<void> {
    return CheckoutOperations.completeCheckoutReport(checkinReportId);
  },

  /**
   * Get checkout session from check-in report
   */
  async getCheckoutSession(checkinReportId: string): Promise<any | null> {
    try {
      const { data: report, error } = await supabase
        .from('inspections')
        .select('report_info')
        .eq('id', checkinReportId)
        .single();

      if (error) throw error;

      const reportInfo = parseReportInfo(report.report_info);
      return reportInfo.checkout_session || null;
    } catch (error) {
      console.error('Error getting checkout session:', error);
      throw error;
    }
  },

  /**
   * Update checkout comparison within check-in report
   */
  async updateCheckoutComparison(checkinReportId: string, comparisonId: string, updates: any): Promise<void> {
    try {
      const { data: report, error: fetchError } = await supabase
        .from('inspections')
        .select('report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) throw fetchError;

      const reportInfo = parseReportInfo(report.report_info);
      
      if (!reportInfo.checkout_session?.comparisons) {
        throw new Error('No checkout session found');
      }

      // Update the specific comparison
      const updatedComparisons = reportInfo.checkout_session.comparisons.map((comp: any) =>
        comp.id === comparisonId ? { ...comp, ...updates } : comp
      );

      const updatedReportInfo = {
        ...reportInfo,
        checkout_session: {
          ...reportInfo.checkout_session,
          comparisons: updatedComparisons,
          last_updated: new Date().toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          report_info: updatedReportInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkinReportId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating checkout comparison:', error);
      throw error;
    }
  },

  // Re-export component extraction methods for backward compatibility
  extractComponentsFromCheckinReport: CheckoutComponentExtractor.extractComponentsFromCheckinReport.bind(CheckoutComponentExtractor),
  processComponentData: CheckoutComponentExtractor.processComponentData.bind(CheckoutComponentExtractor),
  extractComponentImages: CheckoutComponentExtractor.extractComponentImages.bind(CheckoutComponentExtractor)
};
