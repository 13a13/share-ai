
import { BaseReportsAPI } from './baseReportsApi';
import { RoomOperationsAPI } from './roomOperationsApi';
import { ReportUpdateAPI } from './reportUpdateApi';
import { BatchReportsAPI } from './batchOperationsApi';
import { Report, Room, RoomType, RoomImage } from '@/types';

/**
 * Combined ReportsAPI with all functionality including batch operations
 */
export const ReportsAPI = {
  /**
   * Base report operations
   */
  getAll: BaseReportsAPI.getAll,
  getByPropertyId: BaseReportsAPI.getByPropertyId,
  getById: BaseReportsAPI.getById,
  create: BaseReportsAPI.create,
  
  /**
   * Room operations
   */
  addRoom: RoomOperationsAPI.addRoom,
  updateRoom: RoomOperationsAPI.updateRoom,
  addImageToRoom: RoomOperationsAPI.addImageToRoom,
  deleteRoom: RoomOperationsAPI.deleteRoom,
  
  /**
   * Report update operations
   */
  update: ReportUpdateAPI.update,
  delete: ReportUpdateAPI.delete,
  duplicate: ReportUpdateAPI.duplicate,
  updateComponentAnalysis: ReportUpdateAPI.updateComponentAnalysis,
  
  /**
   * Batch operations for performance
   */
  updateBatch: BatchReportsAPI.updateReportBatch,
  getDashboardReports: BatchReportsAPI.getDashboardReports
};
