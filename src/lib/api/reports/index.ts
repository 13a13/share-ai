
// Import specific room-related APIs directly
import { RoomCrudAPI } from './roomCrudApi';
import { RoomUpdateAPI } from './roomUpdateApi';
import { RoomImageAPI } from './roomImageApi';

// Import other report APIs
import { BaseReportsAPI } from './baseReportsApi';
import { BatchReportsAPI } from './batchOperationsApi';
import { CheckoutAPI } from './checkoutApi';
import { CheckoutComparisonAPI } from './checkoutComparisonApi';
import { CheckoutReportAPI } from './checkoutReportApi';
import { OptimizedDashboardAPI } from './optimizedDashboardApi';
import { ReportCreationAPI } from './reportCreation';
import { ReportUpdateAPI } from './reportUpdateApi';
import { ReportStatusUpdater } from './reportStatusUpdater';
import { ComponentAnalysisAPI } from './componentAnalysisApi';

// Export specific room-related APIs directly
export { RoomCrudAPI } from './roomCrudApi';
export { RoomUpdateAPI } from './roomUpdateApi';
export { RoomImageAPI } from './roomImageApi';

// Export other report APIs
export { BaseReportsAPI } from './baseReportsApi';
export { BatchReportsAPI } from './batchOperationsApi';
export { CheckoutAPI } from './checkoutApi';
export { CheckoutComparisonAPI } from './checkoutComparisonApi';
export { CheckoutReportAPI } from './checkoutReportApi';
export { OptimizedDashboardAPI } from './optimizedDashboardApi';
export { ReportCreationAPI } from './reportCreation';
export { ReportUpdateAPI } from './reportUpdateApi';
export { ReportStatusUpdater } from './reportStatusUpdater';
export { ComponentAnalysisAPI } from './componentAnalysisApi';

// Export transformers and utilities
export * from './reportTransformers';
export * from './reportQueries';
export * from './reportQueryUtils';

// Create a unified ReportsAPI that combines all report-related functionality
export const ReportsAPI = {
  // Core report operations from BaseReportsAPI
  ...BaseReportsAPI,
  
  // Report creation
  create: ReportCreationAPI.create,
  
  // Report update operations from ReportUpdateAPI
  update: ReportUpdateAPI.update,
  delete: ReportUpdateAPI.delete,
  duplicate: ReportUpdateAPI.duplicate,
  updateComponentAnalysis: ReportUpdateAPI.updateComponentAnalysis,
  
  // Room operations
  addRoom: RoomCrudAPI.addRoom,
  deleteRoom: RoomCrudAPI.deleteRoom,
  updateRoom: RoomUpdateAPI.updateRoom,
  addImageToRoom: RoomImageAPI.addImageToRoom,
  addMultipleImagesToRoom: RoomImageAPI.addMultipleImagesToRoom,
  getImagesForRoom: RoomImageAPI.getImagesForRoom,
  deleteImageFromRoom: RoomImageAPI.deleteImageFromRoom,
  
  // Component analysis operations
  updateComponentWithAnalysis: ComponentAnalysisAPI.updateComponentWithAnalysis,
  
  // Report status and updates
  updateReportStatus: ReportStatusUpdater.updateReportStatus,
  completeReport: ReportStatusUpdater.completeReport
};
