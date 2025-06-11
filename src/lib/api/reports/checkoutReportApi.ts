
import { CheckoutData } from './checkoutTypes';
import { CheckoutOperations } from './checkoutOperations';
import { CheckoutComponentExtractor } from './checkoutComponentExtractor';

/**
 * Checkout Report API - Updated for new data flow
 * Main API interface for checkout report operations
 */
export const CheckoutReportAPI = {
  /**
   * Create a completed checkout report (only on final completion)
   */
  async createCompletedCheckoutReport(
    checkinReportId: string, 
    checkoutData: CheckoutData, 
    assessmentData: any[]
  ): Promise<any> {
    return CheckoutOperations.createCompletedCheckoutReport(checkinReportId, checkoutData, assessmentData);
  },

  /**
   * Prepare components for checkout assessment
   */
  async prepareCheckoutComponents(checkinReportId: string): Promise<any[]> {
    return CheckoutOperations.prepareCheckoutComponents(checkinReportId);
  },

  /**
   * Save checkout draft
   */
  async saveDraftCheckout(checkinReportId: string, draftData: any): Promise<void> {
    return CheckoutOperations.saveDraftCheckout(checkinReportId, draftData);
  },

  /**
   * Load checkout draft
   */
  async loadDraftCheckout(checkinReportId: string): Promise<any | null> {
    return CheckoutOperations.loadDraftCheckout(checkinReportId);
  },

  /**
   * Clear checkout draft
   */
  async clearDraftCheckout(checkinReportId: string): Promise<void> {
    return CheckoutOperations.clearDraftCheckout(checkinReportId);
  },

  // Re-export component extraction methods for backward compatibility
  extractComponentsFromCheckinReport: CheckoutComponentExtractor.extractComponentsFromCheckinReport.bind(CheckoutComponentExtractor),
  processComponentData: CheckoutComponentExtractor.processComponentData.bind(CheckoutComponentExtractor),
  extractComponentImages: CheckoutComponentExtractor.extractComponentImages.bind(CheckoutComponentExtractor)
};
