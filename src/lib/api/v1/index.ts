/**
 * VerifyVision API v1
 * 
 * Clean, versioned public API with:
 * - Automatic telemetry on all operations
 * - Consistent error handling
 * - Retry logic on transient failures
 * - Type-safe interfaces
 * 
 * This is the recommended API for new code. Legacy APIs will be removed in v2.0.
 */

import { propertiesRepository } from '../repositories/PropertiesRepository';
import { reportRepository } from '../repositories/ReportRepository';
import { roomRepository } from '../repositories/RoomRepository';
import { imageService } from '../services/ImageService';
import { componentService } from '../services/ComponentService';
import { checkoutService } from '../services/CheckoutService';
import { aiProcessingService } from '../services/AIProcessingService';
import { batchOperationService } from '../services/BatchOperationService';

/**
 * Clean, versioned public API
 */
export const ApiV1 = {
  /**
   * Property operations
   */
  properties: {
    findAll: () => propertiesRepository.findAll(),
    findById: (id: string) => propertiesRepository.findById(id),
    create: (property: any) => propertiesRepository.create(property),
    update: (id: string, updates: any) => propertiesRepository.update(id, updates),
    delete: (id: string) => propertiesRepository.delete(id),
    checkLimit: (userId: string) => propertiesRepository.checkPropertyLimit(userId),
  },

  /**
   * Report operations
   */
  reports: {
    findAll: () => reportRepository.findAll(),
    findById: (id: string) => reportRepository.findById(id),
    findByPropertyId: (propertyId: string) => reportRepository.findByPropertyId(propertyId),
    create: (propertyId: string, type: string) => reportRepository.create(propertyId, type),
    update: (id: string, updates: any) => reportRepository.update(id, updates),
    delete: (id: string) => reportRepository.delete(id),
  },

  /**
   * Room operations
   */
  rooms: {
    addToReport: (reportId: string, room: any) => roomRepository.addToReport(reportId, room),
    update: (reportId: string, roomId: string, updates: any) => 
      roomRepository.update(reportId, roomId, updates),
    delete: (reportId: string, roomId: string) => roomRepository.delete(reportId, roomId),
    findById: (reportId: string, roomId: string) => roomRepository.findById(reportId, roomId),
  },

  /**
   * Image operations
   */
  images: {
    addToRoom: (roomId: string, reportId: string, imageUrls: string[]) => 
      imageService.addToRoom(roomId, reportId, imageUrls),
    deleteFromRoom: (roomId: string, imageId: string) => 
      imageService.deleteFromRoom(roomId, imageId),
    getForRoom: (roomId: string, reportId: string) => 
      imageService.getForRoom(roomId, reportId),
    updateAnalysis: (imageId: string, analysis: any) => 
      imageService.updateAnalysis(imageId, analysis),
  },

  /**
   * Component operations
   */
  components: {
    updateWithAnalysis: (
      reportId: string,
      roomId: string,
      componentId: string,
      analysis: any,
      imageIds: string[]
    ) => componentService.updateWithAnalysis(reportId, roomId, componentId, analysis, imageIds),
    updateCondition: (reportId: string, componentId: string, condition: string) =>
      componentService.updateCondition(reportId, componentId, condition),
  },

  /**
   * Checkout operations
   */
  checkout: {
    createComparison: (checkinId: string, checkoutData: any, assessmentData: any[]) => 
      checkoutService.createComparisonReport(checkinId, checkoutData, assessmentData),
    getComparisons: (checkoutId: string) => checkoutService.getComparisons(checkoutId),
    updateComparison: (id: string, updates: any) => 
      checkoutService.updateComparison(id, updates),
    saveDraft: (reportId: string, draft: any) => checkoutService.saveDraft(reportId, draft),
    loadDraft: (reportId: string) => checkoutService.loadDraft(reportId),
    clearDraft: (reportId: string) => checkoutService.clearDraft(reportId),
    prepareComponents: (checkinId: string) => checkoutService.prepareCheckoutComponents(checkinId),
    extractComponents: (report: any) => checkoutService.extractComponentsFromCheckinReport(report),
  },

  /**
   * AI processing operations
   */
  ai: {
    processRoomImages: (
      reportId: string,
      roomId: string,
      imageIds: string[],
      options?: any
    ) => aiProcessingService.processRoomImages(reportId, roomId, imageIds, options),
    processCheckoutImages: (
      checkinReportId: string,
      checkoutReportId: string,
      componentId: string,
      imageIds: string[]
    ) => aiProcessingService.processCheckoutImages(checkinReportId, checkoutReportId, componentId, imageIds),
    processMultipleRooms: (reportId: string, rooms: any[]) =>
      aiProcessingService.processMultipleRooms(reportId, rooms),
  },

  /**
   * Batch operations for performance-critical workflows
   */
  batch: {
    saveRooms: (reportId: string, rooms: any[]) => 
      batchOperationService.saveRoomsInParallel(reportId, rooms),
    updateRooms: (reportId: string, updates: any[]) =>
      batchOperationService.updateRoomsInParallel(reportId, updates),
    deleteRooms: (reportId: string, roomIds: string[]) =>
      batchOperationService.deleteRoomsInParallel(reportId, roomIds),
  },
};
