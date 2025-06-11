
import { CheckoutData } from './checkoutTypes';
import { CheckoutOperations } from './checkoutOperations';
import { CheckoutComponentExtractor } from './checkoutComponentExtractor';

/**
 * Checkout Report API - Refactored Implementation
 * Main API interface for checkout report operations
 */
export const CheckoutReportAPI = {
  /**
   * Phase 2: Create a basic checkout report
   */
  async createBasicCheckoutReport(checkinReportId: string, checkoutData: CheckoutData): Promise<any> {
    return CheckoutOperations.createBasicCheckoutReport(checkinReportId, checkoutData);
  },

  /**
   * Phase 3: Initialize component comparisons for existing checkout
   */
  async initializeComponentComparisons(checkoutReportId: string, checkinReportId: string): Promise<any[]> {
    return CheckoutOperations.initializeComponentComparisons(checkoutReportId, checkinReportId);
  },

  /**
   * Complete a checkout report
   */
  async completeCheckoutReport(checkoutReportId: string): Promise<void> {
    return CheckoutOperations.completeCheckoutReport(checkoutReportId);
  },

  // Re-export component extraction methods for backward compatibility
  extractComponentsFromCheckinReport: CheckoutComponentExtractor.extractComponentsFromCheckinReport.bind(CheckoutComponentExtractor),
  processComponentData: CheckoutComponentExtractor.processComponentData.bind(CheckoutComponentExtractor),
  extractComponentImages: CheckoutComponentExtractor.extractComponentImages.bind(CheckoutComponentExtractor)
};
