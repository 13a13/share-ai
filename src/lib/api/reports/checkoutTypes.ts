
export interface CheckoutComparison {
  id: string;
  checkout_report_id: string;
  checkin_report_id: string;
  room_id: string;
  component_id: string;
  component_name: string;
  status: 'unchanged' | 'changed' | 'pending';
  change_description?: string;
  checkout_condition?: string;
  checkout_images?: string[];
  ai_analysis?: any;
  created_at: string;
  updated_at: string;
}

export interface CheckoutData {
  clerk?: string;
  tenantName?: string;
  tenantPresent?: boolean;
  date?: string;
}
