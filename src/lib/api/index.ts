/**
 * VerifyVision API Layer
 * 
 * New code should use ApiV1 for clean, versioned API with automatic telemetry.
 * Legacy exports maintained for backward compatibility.
 */

// ✅ NEW: Clean, versioned API (RECOMMENDED)
export { ApiV1 } from './v1';

// ⚠️ DEPRECATED: Legacy APIs (will be removed in v2.0)
export { PropertiesAPI } from './propertiesApi';
export { ReportsAPI } from './reports';
export { GeminiAPI } from './geminiApi';
export { PDFGenerationAPI } from './pdfApi';
export { CheckoutAPI } from './reports/checkoutApi';
export { RoomImageAPI } from './reports/roomImageApi';

// Re-export for gradual migration
import { ApiV1 } from './v1';
export const PropertiesAPI_v1 = ApiV1.properties;
export const ReportsAPI_v1 = ApiV1.reports;
export const RoomsAPI_v1 = ApiV1.rooms;
export const ImagesAPI_v1 = ApiV1.images;
export const ComponentsAPI_v1 = ApiV1.components;
export const CheckoutAPI_v1 = ApiV1.checkout;
export const AIAPI_v1 = ApiV1.ai;
export const BatchAPI_v1 = ApiV1.batch;
