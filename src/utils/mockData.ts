
import { Room, RoomComponent, RoomImage, ConditionRating } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const createRoomComponent = (name: string, type: string, isOptional: boolean = false): RoomComponent => {
  return {
    id: uuidv4(),
    name,
    type,
    isOptional,
    description: '',
    conditionSummary: '',
    conditionPoints: [],
    cleanliness: 'domestic_clean',
    condition: 'fair',
    notes: '',
    images: [],
  };
};

export const getComponentsForRoomType = (roomType: string): RoomComponent[] => {
  switch(roomType) {
    case 'bathroom':
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Door', 'door'),
        createRoomComponent('Windows', 'windows'),
        createRoomComponent('Bath/Shower', 'bath'),
        createRoomComponent('Sink', 'sink'),
        createRoomComponent('Toilet', 'toilet'),
        createRoomComponent('Mirror', 'mirror', true),
        createRoomComponent('Towel Rail', 'towel_rail', true),
        createRoomComponent('Extractor Fan', 'extractor_fan', true),
      ];
    case 'kitchen':
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Doors', 'doors'),
        createRoomComponent('Windows', 'windows'),
        createRoomComponent('Countertops', 'countertops'),
        createRoomComponent('Cabinets', 'cabinets'),
        createRoomComponent('Sink', 'sink'),
        createRoomComponent('Oven/Stove', 'oven', true),
        createRoomComponent('Refrigerator', 'refrigerator', true),
        createRoomComponent('Dishwasher', 'dishwasher', true),
        createRoomComponent('Microwave', 'microwave', true),
      ];
    case 'bedroom':
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Door', 'door'),
        createRoomComponent('Windows', 'windows'),
        createRoomComponent('Closet/Wardrobe', 'closet', true),
        createRoomComponent('Bed Frame', 'bed_frame', true),
        createRoomComponent('Mattress', 'mattress', true),
        createRoomComponent('Nightstand', 'nightstand', true),
        createRoomComponent('Dresser', 'dresser', true),
      ];
    case 'living_room':
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Doors', 'doors'),
        createRoomComponent('Windows', 'windows'),
        createRoomComponent('Sofa/Couch', 'sofa', true),
        createRoomComponent('Coffee Table', 'coffee_table', true),
        createRoomComponent('TV Stand', 'tv_stand', true),
        createRoomComponent('Bookcases', 'bookcases', true),
        createRoomComponent('Fireplace', 'fireplace', true),
      ];
    case 'dining_room':
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Door', 'door'),
        createRoomComponent('Windows', 'windows'),
        createRoomComponent('Dining Table', 'dining_table', true),
        createRoomComponent('Chairs', 'chairs', true),
        createRoomComponent('Sideboard', 'sideboard', true),
        createRoomComponent('Light Fixture', 'light_fixture', true),
      ];
    case 'hallway':
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Doors', 'doors'),
        createRoomComponent('Staircase', 'staircase', true),
        createRoomComponent('Coat Rack', 'coat_rack', true),
      ];
    case 'office':
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Door', 'door'),
        createRoomComponent('Windows', 'windows'),
        createRoomComponent('Desk', 'desk', true),
        createRoomComponent('Office Chair', 'office_chair', true),
        createRoomComponent('Shelves', 'shelves', true),
        createRoomComponent('Filing Cabinet', 'filing_cabinet', true),
      ];
    case 'utility_room':
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Door', 'door'),
        createRoomComponent('Washer', 'washer', true),
        createRoomComponent('Dryer', 'dryer', true),
        createRoomComponent('Sink', 'sink', true),
        createRoomComponent('Storage', 'storage', true),
      ];
    default:
      return [
        createRoomComponent('Walls', 'walls'),
        createRoomComponent('Ceiling', 'ceiling'),
        createRoomComponent('Floor', 'floor'),
        createRoomComponent('Door', 'door'),
        createRoomComponent('Windows', 'windows'),
      ];
  }
};

// Helper function to create an empty room section
const createRoomSection = (type: string, title: string): { id: string; type: string; title: string; description: string } => {
  return {
    id: uuidv4(),
    type,
    title,
    description: '',
  };
};

export const createNewRoom = (name: string, type: string, order: number): Room => {
  return {
    id: uuidv4(),
    name,
    type,
    order,
    generalCondition: '',
    images: [],
    components: getComponentsForRoomType(type),
    sections: [
      createRoomSection('walls', 'Walls'),
      createRoomSection('ceiling', 'Ceiling'),
      createRoomSection('flooring', 'Flooring'),
      createRoomSection('doors', 'Doors & Windows'),
      createRoomSection('lighting', 'Lighting'),
    ],
  };
};

// Generates a default report structure for a new report
export const createNewReport = (propertyId: string, type: 'check_in' | 'check_out' | 'inspection') => {
  const now = new Date();
  return {
    id: uuidv4(),
    name: `${type.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())} Report`,
    type,
    propertyId,
    status: 'draft',
    rooms: [],
    reportInfo: {
      reportDate: now.toISOString(),
      clerk: '',
      inventoryType: 'Full Inventory',
      tenantPresent: false,
      tenantName: '',
      additionalInfo: '',
    },
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
};

export const generateMockRoomImages = (count: number = 1): RoomImage[] => {
  const images: RoomImage[] = [];
  
  for (let i = 0; i < count; i++) {
    images.push({
      id: uuidv4(),
      url: `https://source.unsplash.com/random/800x600?room&sig=${Math.random()}`,
      aiProcessed: Math.random() > 0.7,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      aiData: Math.random() > 0.7 ? {
        detectedObjects: ['wall', 'window', 'floor'],
        condition: 'good',
        description: 'Room appears to be in good condition with clean walls and floors.',
      } : undefined,
    });
  }
  
  return images;
};
