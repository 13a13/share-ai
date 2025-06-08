
import { Room, RoomType, RoomImage } from '@/types';
import { RoomCrudAPI } from './roomCrudApi';
import { RoomUpdateAPI } from './roomUpdateApi';
import { RoomImageAPI } from './roomImageApi';

/**
 * Main API interface for room operations
 * This file serves as the main entry point for all room-related operations
 */
export const RoomOperationsAPI = {
  // Room CRUD operations
  addRoom: RoomCrudAPI.addRoom,
  deleteRoom: RoomCrudAPI.deleteRoom,
  
  // Room update operations
  updateRoom: RoomUpdateAPI.updateRoom,
  
  // Room image operations
  addImageToRoom: RoomImageAPI.addImageToRoom,
};
