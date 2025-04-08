
import { GeminiResponse, Property, Report, Room, RoomImage, RoomType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { createNewReport, createNewRoom, mockGeminiResponse, mockProperties, mockReport } from './mockData';

// Since we don't have a real API, we'll mock our API calls with local storage
const LOCAL_STORAGE_KEYS = {
  PROPERTIES: 'shareai-properties',
  REPORTS: 'shareai-reports',
};

// Initialize local storage with mock data if empty
function initializeLocalStorage() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.PROPERTIES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROPERTIES, JSON.stringify(mockProperties));
  }
  
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify([mockReport]));
  }
}

// Properties API
export const PropertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    initializeLocalStorage();
    const properties = localStorage.getItem(LOCAL_STORAGE_KEYS.PROPERTIES);
    return JSON.parse(properties || '[]');
  },
  
  getById: async (id: string): Promise<Property | null> => {
    const properties = await PropertiesAPI.getAll();
    return properties.find(p => p.id === id) || null;
  },
  
  create: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    const properties = await PropertiesAPI.getAll();
    const newProperty: Property = {
      ...property,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    properties.push(newProperty);
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
    return newProperty;
  },
  
  update: async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    const properties = await PropertiesAPI.getAll();
    const index = properties.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    const updatedProperty = {
      ...properties[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    properties[index] = updatedProperty;
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
    return updatedProperty;
  },
};

// Reports API
export const ReportsAPI = {
  getAll: async (): Promise<Report[]> => {
    initializeLocalStorage();
    const reports = localStorage.getItem(LOCAL_STORAGE_KEYS.REPORTS);
    return JSON.parse(reports || '[]');
  },
  
  getByPropertyId: async (propertyId: string): Promise<Report[]> => {
    const reports = await ReportsAPI.getAll();
    return reports.filter(r => r.propertyId === propertyId);
  },
  
  getById: async (id: string): Promise<Report | null> => {
    const reports = await ReportsAPI.getAll();
    return reports.find(r => r.id === id) || null;
  },
  
  create: async (propertyId: string, type: 'check_in' | 'check_out' | 'inspection'): Promise<Report> => {
    const reports = await ReportsAPI.getAll();
    const newReport = createNewReport(propertyId, type);
    
    reports.push(newReport);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return newReport;
  },
  
  update: async (id: string, updates: Partial<Report>): Promise<Report | null> => {
    const reports = await ReportsAPI.getAll();
    const index = reports.findIndex(r => r.id === id);
    
    if (index === -1) return null;
    
    const updatedReport = {
      ...reports[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    reports[index] = updatedReport;
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return updatedReport;
  },
  
  addRoom: async (reportId: string, name: string, type: RoomType): Promise<Room | null> => {
    const reports = await ReportsAPI.getAll();
    const index = reports.findIndex(r => r.id === reportId);
    
    if (index === -1) return null;
    
    const report = reports[index];
    const order = report.rooms.length + 1;
    const newRoom = createNewRoom(name, type, order);
    
    report.rooms.push(newRoom);
    report.updatedAt = new Date();
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return newRoom;
  },
  
  updateRoom: async (reportId: string, roomId: string, updates: Partial<Room>): Promise<Room | null> => {
    const reports = await ReportsAPI.getAll();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) return null;
    
    const report = reports[reportIndex];
    const roomIndex = report.rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) return null;
    
    const updatedRoom = {
      ...report.rooms[roomIndex],
      ...updates,
    };
    
    report.rooms[roomIndex] = updatedRoom;
    report.updatedAt = new Date();
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return updatedRoom;
  },
  
  addImageToRoom: async (reportId: string, roomId: string, imageUrl: string): Promise<RoomImage | null> => {
    const reports = await ReportsAPI.getAll();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) return null;
    
    const report = reports[reportIndex];
    const roomIndex = report.rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) return null;
    
    const newImage: RoomImage = {
      id: uuidv4(),
      url: imageUrl,
      aiProcessed: false,
      timestamp: new Date(),
    };
    
    report.rooms[roomIndex].images.push(newImage);
    report.updatedAt = new Date();
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return newImage;
  },
};

// Gemini API mock functions
export const GeminiAPI = {
  // This would connect to the actual Gemini API in production
  analyzeImage: async (imageUrl: string): Promise<GeminiResponse> => {
    // For the mock, we'll simulate an API delay and return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockGeminiResponse);
      }, 2000);
    });
  },
  
  // Process the image and update the room with the AI analysis
  processRoomImage: async (reportId: string, roomId: string, imageId: string): Promise<Room | null> => {
    const reports = await ReportsAPI.getAll();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) return null;
    
    const report = reports[reportIndex];
    const roomIndex = report.rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) return null;
    
    const room = report.rooms[roomIndex];
    const imageIndex = room.images.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) return null;
    
    // Get the image URL
    const imageUrl = room.images[imageIndex].url;
    
    // Call the Gemini API (mock)
    const aiResult = await GeminiAPI.analyzeImage(imageUrl);
    
    // Update the image with AI data
    room.images[imageIndex] = {
      ...room.images[imageIndex],
      aiProcessed: true,
      aiData: aiResult,
    };
    
    // Update the room with AI assessment data
    const updatedRoom: Room = {
      ...room,
      generalCondition: aiResult.roomAssessment.generalCondition,
      sections: room.sections.map(section => {
        // Match the section type with the AI assessment
        const aiAssessment = aiResult.roomAssessment[section.type as keyof typeof aiResult.roomAssessment];
        
        if (aiAssessment) {
          return {
            ...section,
            description: aiAssessment,
          };
        }
        
        return section;
      }),
    };
    
    report.rooms[roomIndex] = updatedRoom;
    report.updatedAt = new Date();
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return updatedRoom;
  },
};

// PDF Generation API mock
export const PDFGenerationAPI = {
  generatePDF: async (reportId: string): Promise<string> => {
    // In a real implementation, this would call a server endpoint to generate a PDF
    // For now, we'll just simulate a delay and return a fake download URL
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://shareai.com/reports/${reportId}/download`);
      }, 3000);
    });
  },
};
