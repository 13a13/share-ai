
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
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'apartment' | 'commercial';

export interface Report {
  id: string;
  propertyId: string;
  name?: string;
  type: 'check_in' | 'check_out' | 'inspection';
  status: 'draft' | 'in_progress' | 'pending_review' | 'completed' | 'archived';
  reportInfo?: ReportInfo;
  rooms: Room[];
  disclaimers?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  property?: Property; // Joined property data (not stored in DB)
}

export interface ReportInfo {
  reportDate: Date;
  clerk?: string;
  inventoryType?: string;
  tenantPresent?: boolean;
  tenantName?: string;
  additionalInfo?: string;
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
  title: string;
  type: string;
  description: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface RoomComponent {
  id: string;
  name: string;
  type: string;
  description: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  images: RoomComponentImage[];
  isOptional: boolean;
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
