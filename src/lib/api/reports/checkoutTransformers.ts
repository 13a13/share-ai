
import { CheckoutComparison } from './checkoutTypes';

/**
 * Transform raw checkout comparison data from database to application format
 */
export const transformCheckoutComparison = (rawData: any): CheckoutComparison => {
  console.log('Transforming checkout comparison:', rawData);
  
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
    // Ensure ai_analysis is properly parsed and includes check-in data
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
};

/**
 * Transform array of raw checkout comparison data
 */
export const transformCheckoutComparisons = (rawDataArray: any[]): CheckoutComparison[] => {
  console.log('Transforming checkout comparisons array:', rawDataArray.length, 'items');
  
  return rawDataArray.map(transformCheckoutComparison);
};
