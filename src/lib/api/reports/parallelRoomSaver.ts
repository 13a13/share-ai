
import { supabase } from '@/integrations/supabase/client';
import { Room } from '@/types';

/**
 * Parallel room saver for optimized batch operations
 */
export class ParallelRoomSaver {
  private static instance: ParallelRoomSaver;
  private saveQueue: Map<string, Promise<any>> = new Map();

  static getInstance(): ParallelRoomSaver {
    if (!ParallelRoomSaver.instance) {
      ParallelRoomSaver.instance = new ParallelRoomSaver();
    }
    return ParallelRoomSaver.instance;
  }

  async saveRoom(reportId: string, roomId: string, roomData: any): Promise<any> {
    const key = `${reportId}-${roomId}`;
    
    // If already saving this room, return the existing promise
    if (this.saveQueue.has(key)) {
      return this.saveQueue.get(key);
    }

    const savePromise = this.performRoomSave(reportId, roomId, roomData);
    this.saveQueue.set(key, savePromise);

    try {
      const result = await savePromise;
      return result;
    } finally {
      this.saveQueue.delete(key);
    }
  }

  private async performRoomSave(reportId: string, roomId: string, roomData: any): Promise<any> {
    try {
      console.log(`Saving room ${roomId} for report ${reportId}`);

      // Prepare the room data for database storage
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Update the room record
      const { error: roomError } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', roomId);

      if (roomError) {
        console.error('Error updating room:', roomError);
        throw roomError;
      }

      // Update the inspection with room data in report_info
      const { data: inspection, error: fetchError } = await supabase
        .from('inspections')
        .select('report_info')
        .eq('id', reportId)
        .single();

      if (fetchError) {
        console.error('Error fetching inspection:', fetchError);
        throw fetchError;
      }

      // Parse and update report_info
      let reportInfo: any = {};
      try {
        if (inspection?.report_info) {
          reportInfo = typeof inspection.report_info === 'string' 
            ? JSON.parse(inspection.report_info) 
            : inspection.report_info;
        }
      } catch (e) {
        console.error('Error parsing report_info:', e);
        reportInfo = {};
      }

      // Update room data in report_info
      if (!reportInfo.rooms) {
        reportInfo.rooms = [];
      }

      const roomIndex = reportInfo.rooms.findIndex((r: any) => r.id === roomId);
      if (roomIndex >= 0) {
        reportInfo.rooms[roomIndex] = { ...reportInfo.rooms[roomIndex], ...roomData };
      } else {
        reportInfo.rooms.push({ id: roomId, ...roomData });
      }

      // Save updated report_info
      const { error: updateError } = await supabase
        .from('inspections')
        .update({ 
          report_info: JSON.stringify(reportInfo),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) {
        console.error('Error updating inspection report_info:', updateError);
        throw updateError;
      }

      console.log(`Successfully saved room ${roomId}`);
      return { id: roomId, ...roomData };

    } catch (error) {
      console.error(`Failed to save room ${roomId}:`, error);
      throw error;
    }
  }

  async saveRoomsBatch(reportId: string, rooms: { roomId: string; roomData: any }[]): Promise<any[]> {
    console.log(`Starting batch save of ${rooms.length} rooms for report ${reportId}`);
    
    const savePromises = rooms.map(({ roomId, roomData }) => 
      this.saveRoom(reportId, roomId, roomData)
    );

    try {
      const results = await Promise.all(savePromises);
      console.log(`Successfully saved ${results.length} rooms in batch`);
      return results;
    } catch (error) {
      console.error('Error in batch room save:', error);
      throw error;
    }
  }
}

export const parallelRoomSaver = ParallelRoomSaver.getInstance();
