import { Room, RoomComponent, RoomImage, ConditionRating, RoomType } from '@/types';
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
    condition: 'fair',
    cleanliness: 'domestic_clean',
    notes: '',
    images: []
  };
};

export const createNewReport = (propertyId: string, type: 'check_in' | 'check_out' | 'inspection'): any => {
  return {
    id: uuidv4(),
    propertyId: propertyId,
    name: `Report for ${propertyId}`,
    type: type,
    status: 'draft',
    reportInfo: {
      reportDate: new Date().toISOString().slice(0, 10),
      clerk: 'Inspector',
      inventoryType: 'Full Inventory',
      tenantPresent: false,
      tenantName: '',
      additionalInfo: ''
    },
    rooms: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null
  };
};

// Helper function to create an empty room section
const createRoomSection = (type: string, title: string): { id: string; type: string; title: string; description: string; condition: ConditionRating } => {
  return {
    id: uuidv4(),
    type,
    title,
    description: '',
    condition: 'good', // Add the required condition property
  };
};

export const createNewRoom = (name: string, type: string, order: number): Room => {
  return {
    id: uuidv4(),
    name,
    type: type as RoomType, // Cast string to RoomType
    order,
    generalCondition: '',
    images: [],
    sections: [
      createRoomSection('walls', 'Walls'),
      createRoomSection('ceiling', 'Ceiling'),
      createRoomSection('flooring', 'Flooring'),
      createRoomSection('doors', 'Doors'),
      createRoomSection('windows', 'Windows'),
    ],
    components: []
  };
};

export const initialRooms: Room[] = [
  {
    id: uuidv4(),
    name: 'Living Room',
    type: 'living_room',
    order: 1,
    generalCondition: 'Good condition with some wear and tear.',
    images: [],
    sections: [
      createRoomSection('walls', 'Walls'),
      createRoomSection('ceiling', 'Ceiling'),
      createRoomSection('flooring', 'Flooring'),
      createRoomSection('doors', 'Doors'),
      createRoomSection('windows', 'Windows'),
    ],
    components: [
      createRoomComponent('Sofa', 'sofa'),
      createRoomComponent('Television', 'television'),
      createRoomComponent('Coffee Table', 'coffee_table'),
    ]
  },
  {
    id: uuidv4(),
    name: 'Kitchen',
    type: 'kitchen',
    order: 2,
    generalCondition: 'Clean and functional.',
    images: [],
    sections: [
      createRoomSection('walls', 'Walls'),
      createRoomSection('ceiling', 'Ceiling'),
      createRoomSection('flooring', 'Flooring'),
      createRoomSection('doors', 'Doors'),
      createRoomSection('windows', 'Windows'),
    ],
    components: [
      createRoomComponent('Oven', 'oven'),
      createRoomComponent('Sink', 'sink'),
      createRoomComponent('Countertops', 'countertops'),
    ]
  },
  {
    id: uuidv4(),
    name: 'Bedroom',
    type: 'bedroom',
    order: 3,
    generalCondition: 'Well-maintained.',
    images: [],
    sections: [
      createRoomSection('walls', 'Walls'),
      createRoomSection('ceiling', 'Ceiling'),
      createRoomSection('flooring', 'Flooring'),
      createRoomSection('doors', 'Doors'),
      createRoomSection('windows', 'Windows'),
    ],
    components: [
      createRoomComponent('Bed', 'bed'),
      createRoomComponent('Wardrobe', 'wardrobe'),
      createRoomComponent('Nightstand', 'nightstand'),
    ]
  },
  {
    id: uuidv4(),
    name: 'Bathroom',
    type: 'bathroom',
    order: 4,
    generalCondition: 'Good.',
    images: [],
    sections: [
      createRoomSection('walls', 'Walls'),
      createRoomSection('ceiling', 'Ceiling'),
      createRoomSection('flooring', 'Flooring'),
      createRoomSection('doors', 'Doors'),
      createRoomSection('windows', 'Windows'),
    ],
    components: [
      createRoomComponent('Bath', 'bath'),
      createRoomComponent('Toilet', 'toilet'),
      createRoomComponent('Sink', 'sink'),
    ]
  },
  {
    id: uuidv4(),
    name: 'Hallway',
    type: 'hallway',
    order: 5,
    generalCondition: 'Clean.',
    images: [],
    sections: [
      createRoomSection('walls', 'Walls'),
      createRoomSection('ceiling', 'Ceiling'),
      createRoomSection('flooring', 'Flooring'),
      createRoomSection('doors', 'Doors'),
      createRoomSection('windows', 'Windows'),
    ],
    components: [
      createRoomComponent('Light Fixture', 'light_fixture', true),
      createRoomComponent('Mirror', 'mirror', true),
    ]
  }
];
