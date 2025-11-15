/**
 * CheckoutMapper - Handles transformation of checkout comparison data
 * Consolidates logic from checkoutTransformers.ts
 */

import { CheckoutComparison } from '../reports/checkoutTypes';

export class CheckoutMapper {
  /**
   * Transform raw checkout comparison data from database to application format
   */
  static toComparisonModel(rawData: any): CheckoutComparison {
    return {
      id: rawData.id,
      checkout_report_id: rawData.checkout_report_id,
      checkin_report_id: rawData.checkin_report_id,
      room_id: rawData.room_id,
      component_id: rawData.component_id,
      component_name: rawData.component_name,
      status: rawData.status,
      change_description: rawData.change_description,
      checkout_condition: rawData.checkout_condition,
      checkout_images: rawData.checkout_images || [],
      created_at: rawData.created_at,
      updated_at: rawData.updated_at,
      ai_analysis: rawData.ai_analysis || {
        checkinData: {
          originalCondition: 'unknown',
          originalDescription: '',
          originalImages: [],
          roomName: '',
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Transform array of raw checkout comparison data
   */
  static toComparisonModels(rawDataArray: any[]): CheckoutComparison[] {
    return rawDataArray.map(this.toComparisonModel);
  }

  /**
   * Transform checkout comparison for database insert
   */
  static toDatabaseInsert(comparison: Omit<CheckoutComparison, 'id' | 'created_at' | 'updated_at'>) {
    return {
      id: crypto.randomUUID(),
      checkout_report_id: comparison.checkout_report_id,
      checkin_report_id: comparison.checkin_report_id,
      room_id: comparison.room_id,
      component_id: comparison.component_id,
      component_name: comparison.component_name,
      status: comparison.status,
      change_description: comparison.change_description,
      checkout_condition: comparison.checkout_condition,
      checkout_images: comparison.checkout_images || [],
      ai_analysis: comparison.ai_analysis || {}
    };
  }

  /**
   * Transform checkout comparison update for database
   */
  static toDatabaseUpdate(updates: Partial<CheckoutComparison>) {
    const dbUpdates: any = {};
    
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.change_description !== undefined) dbUpdates.change_description = updates.change_description;
    if (updates.checkout_condition !== undefined) dbUpdates.checkout_condition = updates.checkout_condition;
    if (updates.checkout_images !== undefined) dbUpdates.checkout_images = updates.checkout_images;
    if (updates.ai_analysis !== undefined) dbUpdates.ai_analysis = updates.ai_analysis;
    
    dbUpdates.updated_at = new Date().toISOString();
    
    return dbUpdates;
  }
}
