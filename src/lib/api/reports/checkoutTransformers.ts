
import { CheckoutComparison } from './checkoutTypes';

export function transformCheckoutComparison(data: any): CheckoutComparison {
  return {
    id: data.id,
    checkout_report_id: data.checkout_report_id,
    checkin_report_id: data.checkin_report_id,
    room_id: data.room_id,
    component_id: data.component_id,
    component_name: data.component_name,
    status: data.status || 'pending',
    change_description: data.change_description,
    checkout_condition: data.checkout_condition,
    checkout_images: data.checkout_images || [],
    ai_analysis: data.ai_analysis,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export function transformCheckoutComparisons(data: any[]): CheckoutComparison[] {
  return data.map(transformCheckoutComparison);
}
