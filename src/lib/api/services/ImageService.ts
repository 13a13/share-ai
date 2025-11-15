/**
 * ImageService - Handles room image operations
 * Consolidates: roomImageApi.ts
 */

import { RoomImage } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from '../repositories/BaseRepository';

export class ImageService extends BaseRepository<RoomImage> {
  /**
   * Add multiple images to a room
   */
  async addToRoom(roomId: string, reportId: string, imageUrls: string[]): Promise<RoomImage[]> {
    // Validate that we're not storing data URLs
    const invalidUrls = imageUrls.filter(url => url.startsWith('data:'));
    if (invalidUrls.length > 0) {
      throw new Error('Images must be uploaded to storage before saving to database');
    }

    // Prepare batch insert data
    const insertData = imageUrls.map(url => ({
      id: crypto.randomUUID(),
      room_id: roomId,
      inspection_id: reportId,
      url: url
    }));

    const data = await this.executeMutation<any[]>(
      async () => await supabase
        .from('room_images')
        .insert(insertData)
        .select(),
      'ImageService.addToRoom'
    );

    return data.map(image => ({
      id: image.id,
      url: image.url,
      timestamp: new Date(image.created_at),
      aiProcessed: !!image.analysis
    }));
  }

  /**
   * Delete an image from a room
   */
  async deleteFromRoom(roomId: string, imageId: string): Promise<void> {
    await this.executeMutation<any>(
      async () => await supabase
        .from('room_images')
        .delete()
        .eq('id', imageId)
        .eq('room_id', roomId),
      'ImageService.deleteFromRoom'
    );
  }

  /**
   * Get images for a room
   */
  async getForRoom(roomId: string, reportId: string): Promise<RoomImage[]> {
    const data = await this.executeQuery<any[]>(
      async () => await supabase
        .from('room_images')
        .select('*')
        .eq('room_id', roomId)
        .eq('inspection_id', reportId)
        .order('created_at', { ascending: true }),
      'ImageService.getForRoom'
    );

    return data.map(image => ({
      id: image.id,
      url: image.url,
      timestamp: new Date(image.created_at),
      aiProcessed: !!image.analysis
    }));
  }

  /**
   * Update image analysis
   */
  async updateAnalysis(imageId: string, analysis: any): Promise<void> {
    await this.executeMutation<any>(
      async () => await supabase
        .from('room_images')
        .update({ analysis })
        .eq('id', imageId),
      'ImageService.updateAnalysis'
    );
  }
}

// Singleton instance
export const imageService = new ImageService();
