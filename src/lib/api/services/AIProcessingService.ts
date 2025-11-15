/**
 * AIProcessingService - Handles AI processing via edge functions
 * Consolidates: geminiApi.ts AI processing logic
 */

import { edgeFunctionAdapter } from '../adapters/EdgeFunctionAdapter';

export interface AIProcessingOptions {
  inventoryMode?: boolean;
  useAdvancedAnalysis?: boolean;
  roomType?: string;
}

export class AIProcessingService {
  /**
   * Process room images using AI
   */
  async processRoomImages(
    reportId: string,
    roomId: string,
    imageIds: string[],
    options: AIProcessingOptions = {}
  ): Promise<any> {
    const payload = {
      reportId,
      roomId,
      imageIds,
      inventoryMode: options.inventoryMode !== false,
      useAdvancedAnalysis: options.useAdvancedAnalysis || imageIds.length > 1,
      roomType: options.roomType
    };

    return await edgeFunctionAdapter.invokeWithRetry(
      'process-room-image',
      payload,
      {
        retries: 3,
        metadata: {
          reportId,
          roomId,
          imageCount: imageIds.length
        }
      }
    );
  }

  /**
   * Process checkout images with comparison
   */
  async processCheckoutImages(
    checkinReportId: string,
    checkoutReportId: string,
    componentId: string,
    imageIds: string[]
  ): Promise<any> {
    const payload = {
      checkinReportId,
      checkoutReportId,
      componentId,
      imageIds
    };

    return await edgeFunctionAdapter.invokeWithRetry(
      'process-checkout-images',
      payload,
      {
        retries: 3,
        metadata: {
          checkinReportId,
          checkoutReportId,
          componentId
        }
      }
    );
  }

  /**
   * Batch process multiple rooms
   */
  async processMultipleRooms(
    reportId: string,
    rooms: Array<{ roomId: string; imageIds: string[]; options?: AIProcessingOptions }>
  ): Promise<any[]> {
    const invocations = rooms.map(({ roomId, imageIds, options = {} }) => ({
      functionName: 'process-room-image',
      payload: {
        reportId,
        roomId,
        imageIds,
        inventoryMode: options.inventoryMode !== false,
        useAdvancedAnalysis: options.useAdvancedAnalysis || imageIds.length > 1,
        roomType: options.roomType
      },
      options: {
        metadata: {
          reportId,
          roomId,
          imageCount: imageIds.length
        }
      }
    }));

    return await edgeFunctionAdapter.invokeMany(invocations);
  }
}

// Singleton instance
export const aiProcessingService = new AIProcessingService();
