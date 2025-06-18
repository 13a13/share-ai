
// Export all APIs from a single file for easy imports
export { PropertiesAPI } from './propertiesApi';
export { ReportsAPI } from './reports';
export { GeminiAPI } from './geminiApi';
export { PDFGenerationAPI } from './pdfApi';
export { CheckoutAPI } from './reports/checkoutApi';
export { RoomImageAPI } from './reports/roomImageApi';
// Remove the RoomOperationsAPI export as we're now using specific APIs directly
