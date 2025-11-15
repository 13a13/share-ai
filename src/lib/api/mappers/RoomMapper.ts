/**
 * RoomMapper - Handles transformation between database and client Room models
 */

import { Room } from '@/types';
import { parseReportInfo } from '../reports/reportTransformers';

export class RoomMapper {
  /**
   * Transform database room with images and report_info to client Room format
   */
  static toClientModel(roomData: any, images: any[] = []): Room {
    // Parse report_info if it exists
    const reportInfo = roomData.report_info ? parseReportInfo(roomData.report_info) : null;
    
    return {
      id: roomData.id || roomData.room_id,
      name: roomData.name || reportInfo?.roomName || roomData.type || 'Room',
      type: roomData.type || 'general',
      order: 0, // Default order, can be updated later
      generalCondition: reportInfo?.generalCondition || '',
      images: images.map(img => ({
        id: img.id,
        url: img.url,
        timestamp: new Date(img.created_at),
        aiProcessed: !!img.analysis
      })),
      components: reportInfo?.components || [],
      sections: reportInfo?.sections || []
    };
  }

  /**
   * Transform client Room to database insert format
   */
  static toDatabaseInsert(reportId: string, room: Omit<Room, 'id'>, propertyId: string) {
    const reportInfo = {
      roomName: room.name,
      generalCondition: room.generalCondition || '',
      components: room.components || [],
      sections: room.sections || []
    };
    
    return {
      id: crypto.randomUUID(),
      property_id: propertyId,
      type: room.type,
      name: room.name,
      report_info: reportInfo
    };
  }

  /**
   * Transform client Room updates to database format
   */
  static toDatabaseUpdate(updates: Partial<Room>) {
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) {
      dbUpdates.name = updates.name;
    }
    
    if (updates.type !== undefined) {
      dbUpdates.type = updates.type;
    }
    
    // Build report_info update
    const reportInfoUpdate: any = {};
    
    if (updates.name !== undefined) {
      reportInfoUpdate.roomName = updates.name;
    }
    
    if (updates.generalCondition !== undefined) {
      reportInfoUpdate.generalCondition = updates.generalCondition;
    }
    
    if (updates.components !== undefined) {
      reportInfoUpdate.components = updates.components;
    }
    
    if (updates.sections !== undefined) {
      reportInfoUpdate.sections = updates.sections;
    }
    
    if (Object.keys(reportInfoUpdate).length > 0) {
      dbUpdates.report_info = reportInfoUpdate;
    }
    
    dbUpdates.updated_at = new Date().toISOString();
    
    return dbUpdates;
  }
}
