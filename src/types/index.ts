
export interface Property {
  id: string;
  name?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt?: number;
  images?: string[];
  imageUrl?: string; // Add imageUrl property
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'apartment' | 'commercial' | 'house';

export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor' | 'needs_replacement';

export interface Report {
  id: string;
  propertyId: string;
  name?: string;
  type: 'check_in' | 'check_out' | 'inventory' | 'inspection' | 'routine' | 'comparison';
  status: 'draft' | 'in_progress' | 'pending_review' | 'completed' | 'archived';
  reportInfo?: ReportInfo;
  rooms: Room[];
  disclaimers?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  property?: Property; // Joined property data (not stored in DB)
  createdBy?: string; // Add createdBy property
}

export interface ReportInfo {
  reportDate?: string;
  tenantName?: string;
  clerk?: string;
  additionalInfo?: string;
  fileUrl?: string; // URL for uploaded document
  fileName?: string;
  comparisonText?: string; // Added for comparison reports
  inventoryType?: string; // Optional field for backward compatibility
  tenantPresent?: boolean; // Optional field for backward compatibility
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  order: number;
  generalCondition?: string;
  sections: RoomSection[];
  components?: RoomComponent[];
  images: RoomImage[];
}

export type RoomType = 'entrance' | 'hallway' | 'living_room' | 'dining_room' | 'kitchen' | 'bedroom' | 'bathroom' | 'garage' | 'basement' | 'attic' | 'outdoor' | 'other';

export interface RoomSection {
  id: string;
  title: string; // This was missing
  type: string;
  description: string;
  condition: ConditionRating;
  notes?: string;
  images?: RoomImage[]; // Add images property
}

export interface RoomComponent {
  id: string;
  name: string;
  type: string;
  description: string;
  condition: ConditionRating;
  conditionSummary?: string; // Add conditionSummary property
  conditionPoints?: string[]; // Add conditionPoints for bullet points
  cleanliness?: string; // Add cleanliness property
  notes?: string;
  images: RoomComponentImage[];
  isOptional: boolean;
  isEditing?: boolean; // Add isEditing property
  isCustom?: boolean; // Add isCustom property to identify custom components
}

export interface RoomImage {
  id: string;
  url: string;
  timestamp: Date;
  aiProcessed?: boolean;
  aiData?: any;
}

export interface RoomComponentImage {
  id: string;
  url: string;
  timestamp: Date;
  aiProcessed?: boolean;
  aiData?: any;
}

export interface DisclaimerConfig {
  title: string;
  text: string;
  default: boolean;
}
