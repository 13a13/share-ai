/**
 * BatchOperationService - Handles high-performance batch operations
 * Consolidates: parallelRoomSaver.ts, batchOperationsApi.ts
 */

import { Room } from '@/types';
import { roomRepository } from '../repositories/RoomRepository';

export class BatchOperationService {
  /**
   * Save multiple rooms in parallel
   */
  async saveRoomsInParallel(reportId: string, rooms: Array<Omit<Room, 'id'>>): Promise<Room[]> {
    const startTime = performance.now();
    
    console.log(`[BatchOperationService] Starting parallel save of ${rooms.length} rooms`);

    try {
      // Execute all room saves in parallel
      const savedRooms = await Promise.all(
        rooms.map(room => roomRepository.addToReport(reportId, room))
      );

      const duration = Math.round(performance.now() - startTime);
      console.log(`✅ [BatchOperationService] Saved ${savedRooms.length} rooms in ${duration}ms (avg ${Math.round(duration / savedRooms.length)}ms per room)`);

      return savedRooms;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`❌ [BatchOperationService] Failed to save rooms after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Update multiple rooms in parallel
   */
  async updateRoomsInParallel(
    reportId: string,
    updates: Array<{ roomId: string; updates: Partial<Room> }>
  ): Promise<Room[]> {
    const startTime = performance.now();
    
    console.log(`[BatchOperationService] Starting parallel update of ${updates.length} rooms`);

    try {
      const updatedRooms = await Promise.all(
        updates.map(({ roomId, updates: roomUpdates }) => 
          roomRepository.update(reportId, roomId, roomUpdates)
        )
      );

      const duration = Math.round(performance.now() - startTime);
      console.log(`✅ [BatchOperationService] Updated ${updatedRooms.length} rooms in ${duration}ms`);

      return updatedRooms;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`❌ [BatchOperationService] Failed to update rooms after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple rooms in parallel
   */
  async deleteRoomsInParallel(reportId: string, roomIds: string[]): Promise<void> {
    const startTime = performance.now();
    
    console.log(`[BatchOperationService] Starting parallel deletion of ${roomIds.length} rooms`);

    try {
      await Promise.all(
        roomIds.map(roomId => roomRepository.delete(reportId, roomId))
      );

      const duration = Math.round(performance.now() - startTime);
      console.log(`✅ [BatchOperationService] Deleted ${roomIds.length} rooms in ${duration}ms`);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`❌ [BatchOperationService] Failed to delete rooms after ${duration}ms:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const batchOperationService = new BatchOperationService();
