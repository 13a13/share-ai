
import { CheckoutComparison } from './checkoutTypes';

/**
 * Transform raw database data to CheckoutComparison interface
 */
export const transformCheckoutComparison = (item: any): CheckoutComparison => ({
  id: item.id,
  checkout_report_id: item.checkout_report_id,
  checkin_report_id: item.checkin_report_id,
  room_id: item.room_id,
  component_id: item.component_id,
  component_name: item.component_name,
  status: item.status as 'unchanged' | 'changed' | 'pending',
  change_description: item.change_description || undefined,
  checkout_condition: item.checkout_condition || undefined,
  checkout_images: Array.isArray(item.checkout_images) ? item.checkout_images as string[] : [],
  ai_analysis: item.ai_analysis || undefined,
  created_at: item.created_at,
  updated_at: item.updated_at
});

/**
 * Transform array of raw database data to CheckoutComparison array
 */
export const transformCheckoutComparisons = (data: any[]): CheckoutComparison[] => {
  return (data || []).map(transformCheckoutComparison);
};
