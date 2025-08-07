
import { Report } from "@/types";
import { parallelRoomSaver } from "./parallelRoomSaver";

export interface RoomBatchData {
  roomId: string;
  roomData: {
    name: string;
    type: string;
    generalCondition: string;
    components: any[];
    images: any[];
    sections: any[];
  };
}

/**
 * Core optimized save operations for reports
 */
export class OptimizedSaveOperations {
  /**
   * Save multiple rooms in parallel batches
   */
  static async saveRoomsBatch(
    reportId: string,
    roomUpdates: RoomBatchData[],
    onProgress?: (completed: number, total: number, operation: string) => void
  ): Promise<boolean> {
    const BATCH_SIZE = 3;
    const roomBatches = [];
    
    for (let i = 0; i < roomUpdates.length; i += BATCH_SIZE) {
      roomBatches.push(roomUpdates.slice(i, i + BATCH_SIZE));
    }

    let completedRooms = 0;
    const totalRooms = roomUpdates.length;

    try {
      for (const batch of roomBatches) {
        const batchPromises = batch.map(async ({ roomId, roomData }) => {
          try {
            const result = await parallelRoomSaver.saveRoom(reportId, roomId, roomData);
            completedRooms++;
            
            if (onProgress) {
              onProgress(completedRooms, totalRooms, `Saved ${completedRooms}/${totalRooms} rooms...`);
            }
            
            return result;
          } catch (error) {
            console.error(`Failed to save room ${roomId}:`, error);
            throw error;
          }
        });

        await Promise.all(batchPromises);
      }

      return true;
    } catch (error) {
      console.error("Error in batch room save:", error);
      return false;
    }
  }

  /**
   * Prepare room data for batch operations
   */
  static prepareRoomUpdates(report: Report): RoomBatchData[] {
    return report.rooms.map(room => ({
      roomId: room.id,
      roomData: {
        name: room.name,
        type: room.type,
        generalCondition: room.generalCondition,
        components: room.components || [],
        images: room.images || [],
        sections: room.sections || []
      }
    }));
  }

  /**
   * Check if report has rooms with images
   */
  static hasRoomsWithImages(report: Report): boolean {
    return report.rooms.some(room => 
      room.images.length > 0 || (room.components && room.components.some(comp => comp.images.length > 0))
    );
  }
}
