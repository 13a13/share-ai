
export interface GeminiResponse {
  objects: {
    name: string;
    condition: string;
    description: string;
  }[];
  roomAssessment: {
    generalCondition: string;
    walls: string;
    ceiling: string;
    flooring: string;
    doors: string;
    windows: string;
    lighting: string;
    furniture?: string;
    appliances?: string;
    additional?: string;
    cleaning: string;
  };
}
