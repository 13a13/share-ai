import { Property, Report, Room, RoomImage, RoomSection, RoomType } from "@/types";
import { GeminiResponse } from "@/types/gemini";
import { v4 as uuidv4 } from 'uuid';

// Demo properties
export const mockProperties: Property[] = [
  {
    id: '1',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    propertyType: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    imageUrl: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    address: '456 Park Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10022',
    propertyType: 'condo',
    bedrooms: 3,
    bathrooms: 2,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-02-20'),
  },
  {
    id: '3',
    address: '789 Ocean Drive',
    city: 'Miami',
    state: 'FL',
    zipCode: '33139',
    propertyType: 'house',
    bedrooms: 4,
    bathrooms: 3,
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
  },
];

// Standard disclaimer templates
export const standardDisclaimers = [
  'This report details the condition of the property at the time of inspection only.',
  'Some areas of the property may not have been accessible during inspection.',
  'Minor cosmetic issues might not be individually noted if they do not affect the function of the item.',
  'This report is not a warranty or guarantee of the condition of the property.',
  'All items listed are the property of the landlord unless specifically noted otherwise.',
];

// Room templates to quickly create room structures
export const roomTemplates: Record<RoomType, Omit<Room, 'id' | 'images'>> = {
  entrance: {
    name: 'Entrance',
    type: 'entrance',
    order: 1,
    generalCondition: 'Good condition overall with minor wear on doorframe',
    sections: createDefaultSections(),
  },
  hallway: {
    name: 'Hallway',
    type: 'hallway',
    order: 2,
    generalCondition: 'Well maintained with light scuff marks on the walls',
    sections: createDefaultSections(),
  },
  living_room: {
    name: 'Living Room',
    type: 'living_room',
    order: 3,
    generalCondition: 'Excellent condition with all fixtures in working order',
    sections: createDefaultSections(),
  },
  dining_room: {
    name: 'Dining Room',
    type: 'dining_room',
    order: 4,
    generalCondition: 'Good condition with some signs of usage',
    sections: createDefaultSections(),
  },
  kitchen: {
    name: 'Kitchen',
    type: 'kitchen',
    order: 5,
    generalCondition: 'Well maintained with all appliances functioning properly',
    sections: createDefaultSections(true),
  },
  bedroom: {
    name: 'Bedroom',
    type: 'bedroom',
    order: 6,
    generalCondition: 'Good condition with minor wear on flooring',
    sections: createDefaultSections(false, true),
  },
  bathroom: {
    name: 'Bathroom',
    type: 'bathroom',
    order: 7,
    generalCondition: 'Good condition with all fixtures operating as expected',
    sections: createDefaultSections(false, false, true),
  },
  garage: {
    name: 'Garage',
    type: 'garage',
    order: 8,
    generalCondition: 'Functional with expected wear and tear',
    sections: createDefaultSections(),
  },
  basement: {
    name: 'Basement',
    type: 'basement',
    order: 9,
    generalCondition: 'Dry and well maintained',
    sections: createDefaultSections(),
  },
  attic: {
    name: 'Attic',
    type: 'attic',
    order: 10,
    generalCondition: 'Accessible and in fair condition',
    sections: createDefaultSections(),
  },
  outdoor: {
    name: 'Outdoor Space',
    type: 'outdoor',
    order: 11,
    generalCondition: 'Well maintained outdoor space',
    sections: createDefaultSections(),
  },
  other: {
    name: 'Other Room',
    type: 'other',
    order: 12,
    generalCondition: 'In good general condition',
    sections: createDefaultSections(),
  },
};

// Helper to create default sections for a room
function createDefaultSections(includeAppliances = false, includeFurniture = false, isForBathroom = false): RoomSection[] {
  const sections: RoomSection[] = [
    {
      id: uuidv4(),
      type: 'walls',
      condition: 'good',
      description: 'Painted drywall with eggshell finish',
      notes: 'Minor scuff marks near light switches',
    },
    {
      id: uuidv4(),
      type: 'ceiling',
      condition: 'good',
      description: 'Smooth painted ceiling',
      notes: 'No visible damage or stains',
    },
    {
      id: uuidv4(),
      type: 'flooring',
      condition: 'good',
      description: isForBathroom ? 'Ceramic tile flooring' : 'Hardwood flooring',
      notes: 'Some light wear in high traffic areas',
    },
    {
      id: uuidv4(),
      type: 'doors',
      condition: 'good',
      description: 'Solid wood door with brass hardware',
      notes: 'Functions properly, minor wear on handle',
    },
    {
      id: uuidv4(),
      type: 'windows',
      condition: 'good',
      description: 'Double-hung vinyl windows with screens',
      notes: 'All operable, good seal integrity',
    },
    {
      id: uuidv4(),
      type: 'lighting',
      condition: 'excellent',
      description: 'Recessed LED lighting with dimmer switch',
      notes: 'All fixtures working properly',
    },
    {
      id: uuidv4(),
      type: 'cleaning',
      condition: 'good',
      description: 'Room is generally clean',
      notes: 'Some dust on windowsills',
    },
  ];

  if (includeFurniture) {
    sections.push({
      id: uuidv4(),
      type: 'furniture',
      condition: 'good',
      description: 'Bed frame, mattress, nightstand, and dresser',
      notes: 'All items in good condition with minor wear',
    });
  }

  if (includeAppliances) {
    sections.push({
      id: uuidv4(),
      type: 'appliances',
      condition: 'good',
      description: 'Refrigerator, stove, dishwasher, and microwave',
      notes: 'All appliances functional and in good condition',
    });
  }

  sections.push({
    id: uuidv4(),
    type: 'additional',
    condition: 'good',
    description: 'Smoke detector, carbon monoxide detector',
    notes: 'All safety devices functional and properly mounted',
  });

  return sections;
}

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
  };
}

// Helper to create a new room
export function createNewRoom(name: string, type: RoomType, order: number): Room {
  const template = roomTemplates[type];
  return {
    id: uuidv4(),
    name,
    type,
    order,
    generalCondition: template.generalCondition,
    images: [],
    sections: template.sections.map(section => ({...section, id: uuidv4()})),
  };
}

// Sample mock report for display purposes
export const mockReport: Report = {
  id: 'r1',
  propertyId: '1',
  type: 'check_in',
  status: 'in_progress',
  createdAt: new Date('2023-04-15'),
  updatedAt: new Date('2023-04-15'),
  createdBy: 'John Doe',
  rooms: [
    {
      id: 'room1',
      name: 'Living Room',
      type: 'living_room',
      order: 1,
      generalCondition: 'Good condition with minor wear on furniture',
      images: [
        {
          id: 'img1',
          url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92',
          aiProcessed: true,
          timestamp: new Date('2023-04-15T10:30:00'),
        }
      ],
      sections: roomTemplates.living_room.sections,
    },
    {
      id: 'room2',
      name: 'Kitchen',
      type: 'kitchen',
      order: 2,
      generalCondition: 'Excellent condition with all appliances working properly',
      images: [
        {
          id: 'img2',
          url: 'https://images.unsplash.com/photo-1556911220-bda9f7d8bd3f',
          aiProcessed: true,
          timestamp: new Date('2023-04-15T10:35:00'),
        }
      ],
      sections: roomTemplates.kitchen.sections,
    }
  ],
  disclaimers: standardDisclaimers,
};

// Mock AI analysis response
export const mockGeminiResponse: GeminiResponse = {
  objects: [
    {
      name: "Sofa",
      condition: "good",
      description: "Gray fabric sofa with minor wear on armrests"
    },
    {
      name: "Coffee table",
      condition: "excellent",
      description: "Wooden coffee table with glass top, no visible damage"
    },
    {
      name: "TV stand",
      condition: "good",
      description: "Black wooden TV stand with some light scratches"
    }
  ],
  roomAssessment: {
    generalCondition: "The room is in good condition overall with some minor signs of normal wear and use.",
    walls: "White painted drywall in good condition with minor scuffs near the doorway.",
    ceiling: "White painted ceiling with no visible stains or damage.",
    flooring: "Hardwood flooring in good condition with some light scratches near the sofa.",
    doors: "Solid wood door with brass handle, functions properly.",
    windows: "Double-pane windows with white frames, good seal integrity and clean glass.",
    lighting: "Recessed LED lighting and one floor lamp, all functioning properly.",
    furniture: "Gray fabric sofa, wooden coffee table, and black TV stand all in good condition.",
    cleaning: "Room appears clean with minimal dust, ready for occupancy."
  }
};
