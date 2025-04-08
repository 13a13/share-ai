
export interface GeminiResponse {
  text: string;
  condition: string;
  details: {
    walls?: string;
    ceiling?: string;
    flooring?: string;
    doors?: string;
    windows?: string;
    lighting?: string;
    furniture?: string;
    appliances?: string;
    cleaning?: string;
  };
}
