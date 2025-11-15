/**
 * RoomRepository - Centralized data access for rooms
 * Consolidates: roomCrudApi.ts, roomUpdateApi.ts
 */

import { Room } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from './BaseRepository';
import { RoomMapper } from '../mappers/RoomMapper';
import { NotFoundError } from '../errors/ApiErrors';

export class RoomRepository extends BaseRepository<Room> {
  /**
   * Add a room to a report
   */
  async addToReport(reportId: string, room: Omit<Room, 'id'>): Promise<Room> {
    // Get the inspection to find property_id
    const { data: inspection } = await supabase
      .from('inspections')
      .select('room_id')
      .eq('id', reportId)
      .single();
    
    if (!inspection) {
      throw new NotFoundError('Inspection', reportId);
    }
    
    // Get the room to find property_id
    const { data: mainRoom } = await supabase
      .from('rooms')
      .select('property_id')
      .eq('id', inspection.room_id)
      .single();
    
    if (!mainRoom) {
      throw new NotFoundError('Room', inspection.room_id);
    }
    
    const roomData = RoomMapper.toDatabaseInsert(reportId, room, mainRoom.property_id);
    
    const dbRoom = await this.executeMutation<any>(
      async () => await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single(),
      'RoomRepository.addToReport'
    );
    
    // Get images for the room (should be empty for new room)
    const { data: images } = await supabase
      .from('room_images')
      .select('*')
      .eq('room_id', dbRoom.id)
      .eq('inspection_id', reportId);
    
    return RoomMapper.toClientModel(
      { ...dbRoom, report_info: roomData.report_info },
      images || []
    );
  }

  /**
   * Update a room
   */
  async update(reportId: string, roomId: string, updates: Partial<Room>): Promise<Room> {
    const dbUpdates = RoomMapper.toDatabaseUpdate(updates);
    
    const dbRoom = await this.executeMutation<any>(
      async () => await supabase
        .from('rooms')
        .update(dbUpdates)
        .eq('id', roomId)
        .select()
        .single(),
      'RoomRepository.update'
    );
    
    if (!dbRoom) {
      throw new NotFoundError('Room', roomId);
    }
    
    // Get images for the room
    const { data: images } = await supabase
      .from('room_images')
      .select('*')
      .eq('room_id', roomId)
      .eq('inspection_id', reportId);
    
    return RoomMapper.toClientModel(
      { ...dbRoom, report_info: dbUpdates.report_info || dbRoom.report_info },
      images || []
    );
  }

  /**
   * Delete a room
   */
  async delete(reportId: string, roomId: string): Promise<void> {
    // Delete all images for this room first
    await supabase
      .from('room_images')
      .delete()
      .eq('room_id', roomId)
      .eq('inspection_id', reportId);
    
    // Delete the room
    await this.executeMutation<any>(
      async () => await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .select()
        .single(),
      'RoomRepository.delete'
    );
  }

  /**
   * Get a room by ID
   */
  async findById(reportId: string, roomId: string): Promise<Room | null> {
    try {
      const { data: dbRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (!dbRoom) {
        return null;
      }
      
      // Get images for the room
      const { data: images } = await supabase
        .from('room_images')
        .select('*')
        .eq('room_id', roomId)
        .eq('inspection_id', reportId);
      
      return RoomMapper.toClientModel(dbRoom, images || []);
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }
}

// Singleton instance
export const roomRepository = new RoomRepository();
