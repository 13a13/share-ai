
import { Property, Report, Room, RoomImage, RoomSection, RoomType, RoomComponent } from "@/types";
import { v4 as uuidv4 } from 'uuid';

// Standard disclaimer templates
export const standardDisclaimers = [
  'This report details the condition of the property at the time of inspection only.',
  'Some areas of the property may not have been accessible during inspection.',
  'Minor cosmetic issues might not be individually noted if they do not affect the function of the item.',
  'This report is not a warranty or guarantee of the condition of the property.',
  'All items listed are the property of the landlord unless specifically noted otherwise.',
];

// Helper to create a new empty report
export function createNewReport(propertyId: string, type: 'check_in' | 'check_out' | 'inspection'): Report {
  return {
    id: uuidv4(),
    propertyId,
    type,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'Current User',
    rooms: [],
    disclaimers: [...standardDisclaimers],
    completedAt: null,
  };
}

// Helper to create a new room
export function createNewRoom(name: string, type: RoomType, order: number): Room {
  return {
    id: uuidv4(),
    name,
    type,
    order,
    generalCondition: '',
    images: [],
    sections: createDefaultSections(type),
  };
}

// Helper to create default sections for a room based on room type
function createDefaultSections(roomType: RoomType): RoomSection[] {
  const sections: RoomSection[] = [
    {
      id: uuidv4(),
      title: "Walls",
      type: 'walls',
      condition: 'good',
      description: 'Painted walls',
      notes: '',
      images: [],
    },
    {
      id: uuidv4(),
      title: "Ceiling",
      type: 'ceiling',
      condition: 'good',
      description: 'Ceiling',
      notes: '',
      images: [],
    },
    {
      id: uuidv4(),
      title: "Flooring",
      type: 'flooring',
      condition: 'good',
      description: roomType === 'bathroom' ? 'Tile flooring' : 'Flooring',
      notes: '',
      images: [],
    },
    {
      id: uuidv4(),
      title: "Doors",
      type: 'doors',
      condition: 'good',
      description: 'Doors and frames',
      notes: '',
      images: [],
    },
    {
      id: uuidv4(),
      title: "Windows",
      type: 'windows',
      condition: 'good',
      description: 'Windows and frames',
      notes: '',
      images: [],
    },
    {
      id: uuidv4(),
      title: "Lighting",
      type: 'lighting',
      condition: 'good',
      description: 'Lighting fixtures',
      notes: '',
      images: [],
    }
  ];

  // Add room-specific sections
  if (roomType === 'bathroom') {
    sections.push({
      id: uuidv4(),
      title: "Plumbing",
      type: 'plumbing',
      condition: 'good',
      description: 'Sink, toilet, and shower/bath',
      notes: '',
      images: [],
    });
  } else if (roomType === 'kitchen') {
    sections.push({
      id: uuidv4(),
      title: "Appliances",
      type: 'appliances',
      condition: 'good',
      description: 'Kitchen appliances',
      notes: '',
      images: [],
    });
    sections.push({
      id: uuidv4(),
      title: "Cabinetry",
      type: 'cabinetry',
      condition: 'good',
      description: 'Cabinets and countertops',
      notes: '',
      images: [],
    });
  } else if (roomType === 'bedroom' || roomType === 'living_room') {
    sections.push({
      id: uuidv4(),
      title: "Furniture",
      type: 'furniture',
      condition: 'good',
      description: 'Furniture items',
      notes: '',
      images: [],
    });
  }

  // Add cleaning section to all rooms
  sections.push({
    id: uuidv4(),
    title: "Cleaning",
    type: 'cleaning',
    condition: 'good',
    description: 'Overall cleanliness',
    notes: '',
    images: [],
  });

  return sections;
}

// Helper to create a new room component
export function createDefaultComponent(name: string, type: string, isOptional: boolean): RoomComponent {
  return {
    id: uuidv4(),
    name,
    type,
    description: "",
    condition: "fair",
    notes: "",
    images: [],
    isOptional,
  };
}
