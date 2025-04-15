import { Report, Room, RoomType, RoomImage } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEYS, initializeLocalStorage } from './utils';
import { createNewReport, createNewRoom } from '../mockData';
import { PropertiesAPI } from './propertiesApi';
import { uploadReportImage, deleteReportImage } from '@/utils/supabaseStorage';

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
    
    // Get property details to create folder structure
    const property = await PropertiesAPI.getById(report.propertyId);
    if (!property) return null;

    // Upload image to Supabase storage
    const storedImageUrl = await uploadReportImage(
      imageUrl, 
      reportId, 
      `${property.address}, ${property.city}, ${property.state}`, 
      report.type
    );

    if (!storedImageUrl) return null;
    
    const newImage: RoomImage = {
      id: uuidv4(),
      url: storedImageUrl,
      aiProcessed: false,
      timestamp: new Date(),
    };
    
    report.rooms[roomIndex].images.push(newImage);
    report.updatedAt = new Date();
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return newImage;
  },

  // Update the delete room method to remove associated images from storage
  deleteRoom: async (reportId: string, roomId: string): Promise<void> => {
    const reports = await ReportsAPI.getAll();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) return;
    
    const report = reports[reportIndex];
    const roomToDelete = report.rooms.find(room => room.id === roomId);
    
    if (roomToDelete) {
      // Delete all images associated with this room from storage
      for (const image of roomToDelete.images) {
        await deleteReportImage(image.url);
      }
    }
    
    report.rooms = report.rooms.filter(room => room.id !== roomId);
    report.updatedAt = new Date();
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }
};
