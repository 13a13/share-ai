
import { Property, Report, Room, RoomImage, RoomType, RoomComponent } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { createNewReport, createNewRoom, createDefaultComponent } from './mockData';
import { supabase } from '@/integrations/supabase/client';

// Storage keys for local data persistence
const LOCAL_STORAGE_KEYS = {
  PROPERTIES: 'shareai-properties',
  REPORTS: 'shareai-reports',
};

// Initialize local storage if empty
function initializeLocalStorage() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.PROPERTIES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROPERTIES, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify([]));
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
  
  delete: async (id: string): Promise<void> => {
    const reports = await ReportsAPI.getAll();
    const filteredReports = reports.filter(r => r.id !== id);
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(filteredReports));
  },
  
  duplicate: async (id: string): Promise<Report | null> => {
    const reports = await ReportsAPI.getAll();
    const reportToDuplicate = reports.find(r => r.id === id);
    
    if (!reportToDuplicate) return null;
    
    const newReport: Report = {
      ...reportToDuplicate,
      id: uuidv4(),
      name: `${reportToDuplicate.name || ''} (Copy)`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      rooms: reportToDuplicate.rooms.map(room => ({
        ...room,
        id: uuidv4(),
        components: room.components ? room.components.map(component => ({
          ...component,
          id: uuidv4(),
          images: [],
        })) : [],
        images: [],
      })),
    };
    
    reports.push(newReport);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return newReport;
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
  
  deleteRoom: async (reportId: string, roomId: string): Promise<void> => {
    const reports = await ReportsAPI.getAll();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) return;
    
    const report = reports[reportIndex];
    report.rooms = report.rooms.filter(room => room.id !== roomId);
    report.updatedAt = new Date();
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }
};

// Gemini API implementation
export const GeminiAPI = {
  analyzeImage: async (imageUrl: string, roomType?: string): Promise<any> => {
    try {
      const response = await supabase.functions.invoke('process-room-image', {
        body: { imageUrl, roomType },
      });

      if (response.error) {
        console.error('Error calling Gemini API:', response.error);
        throw new Error('Failed to analyze image');
      }

      return response.data;
    } catch (error) {
      console.error('Error in analyzeImage:', error);
      throw error;
    }
  },
  
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
    
    const imageUrl = room.images[imageIndex].url;
    
    try {
      const aiResult = await GeminiAPI.analyzeImage(imageUrl, room.type);
      
      room.images[imageIndex] = {
        ...room.images[imageIndex],
        aiProcessed: true,
        aiData: aiResult,
      };
      
      const updatedRoom: Room = {
        ...room,
        generalCondition: aiResult.roomAssessment.generalCondition,
        sections: room.sections.map(section => {
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
    } catch (error) {
      console.error('Error processing room image:', error);
      return null;
    }
  },
};

// PDF Generation API
export const PDFGenerationAPI = {
  generatePDF: async (reportId: string): Promise<string> => {
    // In a real implementation, this would call a backend service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://example.com/reports/${reportId}/download`);
      }, 3000);
    });
  },
};
