
export type Property = {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'apartment' | 'house' | 'condo' | 'other';
  bedrooms: number;
  bathrooms: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomType = 
  | 'entrance' 
  | 'hallway'
  | 'living_room' 
  | 'dining_room'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'garage'
  | 'basement'
  | 'attic'
  | 'outdoor'
  | 'other';

export type ConditionRating = 
  | 'excellent' 
  | 'good' 
  | 'fair' 
  | 'poor' 
  | 'needs_replacement';

export type CleanlinessRating =
  | 'spotless'
  | 'clean'
  | 'needs_light_cleaning'
  | 'needs_deep_cleaning'
  | 'unsanitary';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  order: number;
  generalCondition: string;
  images: RoomImage[];
  sections: RoomSection[];
}

export interface RoomImage {
  id: string;
  url: string;
  aiProcessed: boolean;
  aiData?: any;
  timestamp: Date;
}

export interface RoomSection {
  id: string;
  type: 'walls' | 'ceiling' | 'flooring' | 'doors' | 'windows' | 'lighting' | 'furniture' | 'appliances' | 'additional' | 'cleaning';
  description: string;
  condition: ConditionRating;
  notes?: string;
  images?: RoomImage[];
}

export interface Report {
  id: string;
  propertyId: string;
  property?: Property;
  type: 'check_in' | 'check_out' | 'inspection';
  status: 'draft' | 'in_progress' | 'pending_review' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  createdBy: string;
  reviewedBy?: string;
  rooms: Room[];
  generalNotes?: string;
  disclaimers: string[];
}

export interface GeminiResponse {
  objects: {
    name: string;
    condition: ConditionRating;
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
