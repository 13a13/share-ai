
import { CheckoutReportAPI } from './checkoutReportApi';
import { CheckoutComparisonAPI } from './checkoutComparisonApi';

// Re-export types
export type { CheckoutComparison, CheckoutData } from './checkoutTypes';

// Re-export APIs
export { CheckoutReportAPI } from './checkoutReportApi';
export { CheckoutComparisonAPI } from './checkoutComparisonApi';

// Combined API for backward compatibility
export const CheckoutAPI = {
  // Checkout report operations - using actual available methods
  createCompletedCheckoutReport: CheckoutReportAPI.createCompletedCheckoutReport,
  prepareCheckoutComponents: CheckoutReportAPI.prepareCheckoutComponents,
  saveDraftCheckout: CheckoutReportAPI.saveDraftCheckout,
  loadDraftCheckout: CheckoutReportAPI.loadDraftCheckout,
  clearDraftCheckout: CheckoutReportAPI.clearDraftCheckout,
  
  // Comparison operations
  getCheckoutComparisons: CheckoutComparisonAPI.getCheckoutComparisons,
  initializeCheckoutComparisons: CheckoutComparisonAPI.initializeCheckoutComparisons,
  updateCheckoutComparison: CheckoutComparisonAPI.updateCheckoutComparison
};
