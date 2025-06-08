
import { CheckoutComparison } from './checkoutTypes';

/**
 * Transform checkout comparison data from database format
 */
export const transformCheckoutComparison = (dbData: any): CheckoutComparison => {
  return {
    id: dbData.id,
    checkout_report_id: dbData.checkout_report_id,
    checkin_report_id: dbData.checkin_report_id,
    room_id: dbData.room_id,
    component_id: dbData.component_id,
    component_name: dbData.component_name,
    status: dbData.status || 'pending',
    change_description: dbData.change_description,
    checkout_condition: dbData.checkout_condition,
    checkout_images: Array.isArray(dbData.checkout_images) 
      ? dbData.checkout_images 
      : (dbData.checkout_images ? JSON.parse(dbData.checkout_images) : []),
    ai_analysis: dbData.ai_analysis ? 
      (typeof dbData.ai_analysis === 'string' ? JSON.parse(dbData.ai_analysis) : dbData.ai_analysis) 
      : null,
    created_at: dbData.created_at,
    updated_at: dbData.updated_at
  };
};

/**
 * Transform array of checkout comparisons
 */
export const transformCheckoutComparisons = (dbDataArray: any[]): CheckoutComparison[] => {
  return dbDataArray.map(transformCheckoutComparison);
};
