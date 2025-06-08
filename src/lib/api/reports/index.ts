
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

// Export transformers and utilities
export * from './reportTransformers';
export * from './reportQueries';
export * from './reportQueryUtils';

// Create a unified ReportsAPI that combines all report-related functionality
export const ReportsAPI = {
  // Core report operations
  ...BaseReportsAPI,
  
  // Room operations
  addRoom: RoomCrudAPI.addRoom,
  deleteRoom: RoomCrudAPI.deleteRoom,
  updateRoom: RoomUpdateAPI.updateRoom,
  addImageToRoom: RoomImageAPI.addImageToRoom,
  
  // Report status and updates
  updateReportStatus: ReportStatusUpdater.updateReportStatus,
  completeReport: ReportStatusUpdater.completeReport
};
