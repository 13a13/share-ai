/**
 * ReportRepository - Centralized data access for reports
 * Consolidates: reportQueries.ts, reportCreation.ts, reportUpdateApi.ts
 */

import { Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from './BaseRepository';
import { ReportMapper } from '../mappers/ReportMapper';
import { RoomMapper } from '../mappers/RoomMapper';
import { NotFoundError } from '../errors/ApiErrors';

export class ReportRepository extends BaseRepository<Report> {
  /**
   * Find all reports for the authenticated user
   */
  async findAll(): Promise<Report[]> {
    const data = await this.executeQuery<any[]>(
      async () => await supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false }),
      'ReportRepository.findAll'
    );
    
    const reports: Report[] = [];
    
    // Load each report with minimal data (no rooms for list view)
    for (const inspection of data) {
      try {
        // Get the room
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', inspection.room_id)
          .single();
        
        if (!room) continue;
        
        // Get property
        const { data: property } = await supabase
          .from('properties')
          .select('*')
          .eq('id', room.property_id)
          .single();
        
        if (!property) continue;
        
        reports.push(ReportMapper.toClientModel(inspection, room, property));
      } catch (error) {
        console.error('Error loading report:', inspection.id, error);
      }
    }
    
    return reports;
  }

  /**
   * Find a report by ID with all rooms
   */
  async findById(id: string): Promise<Report | null> {
    try {
      // Get inspection
      const inspection = await this.executeQuery<any>(
        async () => await supabase
          .from('inspections')
          .select('*')
          .eq('id', id)
          .single(),
        'ReportRepository.findById'
      );
      
      // Get the room
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', inspection.room_id)
        .single();
      
      if (!room) {
        throw new NotFoundError('Room', inspection.room_id);
      }
      
      // Get property
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', room.property_id)
        .single();
      
      if (!property) {
        throw new NotFoundError('Property', room.property_id);
      }
      
      // Get images for the room
      const { data: images } = await supabase
        .from('room_images')
        .select('*')
        .eq('inspection_id', id)
        .eq('room_id', room.id);
      
      // Transform room with images
      const mainRoom = RoomMapper.toClientModel(
        { ...room, report_info: inspection.report_info },
        images || []
      );
      
      // Build the report
      const report = ReportMapper.toClientModel(inspection, room, property, [mainRoom]);
      
      return report;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      console.error('Error in findById:', error);
      return null;
    }
  }

  /**
   * Find reports by property ID
   */
  async findByPropertyId(propertyId: string): Promise<Report[]> {
    try {
      // Get all rooms for this property
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId);
      
      if (!rooms || !rooms.length) {
        return [];
      }
      
      const roomIds = rooms.map(r => r.id);
      
      // Get all inspections for these rooms
      const { data: inspections } = await supabase
        .from('inspections')
        .select('*')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false });
      
      if (!inspections || !inspections.length) {
        return [];
      }
      
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      
      if (!property) {
        throw new NotFoundError('Property', propertyId);
      }
      
      const reports: Report[] = [];
      
      for (const inspection of inspections) {
        const room = rooms.find(r => r.id === inspection.room_id);
        if (!room) continue;
        
        reports.push(ReportMapper.toClientModel(inspection, room, property));
      }
      
      return reports;
    } catch (error) {
      console.error('Error in findByPropertyId:', error);
      return [];
    }
  }

  /**
   * Create a new report
   */
  async create(propertyId: string, type: string): Promise<Report> {
    try {
      // Create a new room for the report
      const roomId = crypto.randomUUID();
      
      await this.executeMutation<any>(
        async () => await supabase.from('rooms').insert({
          id: roomId,
          property_id: propertyId,
          type: 'living_room'
        }),
        'ReportRepository.createRoom'
      );
      
      // Create the inspection
      const reportData = ReportMapper.toDatabaseInsert(propertyId, type, roomId);
      
      const inspection = await this.executeMutation<any>(
        async () => await supabase
          .from('inspections')
          .insert(reportData)
          .select()
          .single(),
        'ReportRepository.create'
      );
      
      // Get the property
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      
      if (!property) {
        throw new NotFoundError('Property', propertyId);
      }
      
      // Get the room
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (!room) {
        throw new NotFoundError('Room', roomId);
      }
      
      const report = ReportMapper.toClientModel(inspection, room, property, []);
      return report;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  /**
   * Update a report
   */
  async update(id: string, updates: Partial<Report>): Promise<Report> {
    const dbUpdates = ReportMapper.toDatabaseUpdate(updates);
    
    const inspection = await this.executeMutation<any>(
      async () => await supabase
        .from('inspections')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single(),
      'ReportRepository.update'
    );
    
    if (!inspection) {
      throw new NotFoundError('Report', id);
    }
    
    // Get the room
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', inspection.room_id)
      .single();
    
    if (!room) {
      throw new NotFoundError('Room', inspection.room_id);
    }
    
    // Get property
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', room.property_id)
      .single();
    
    if (!property) {
      throw new NotFoundError('Property', room.property_id);
    }
    
    return ReportMapper.toClientModel(inspection, room, property);
  }

  /**
   * Delete a report
   */
  async delete(id: string): Promise<void> {
    await this.executeMutation<any>(
      async () => await supabase
        .from('inspections')
        .delete()
        .eq('id', id)
        .select()
        .single(),
      'ReportRepository.delete'
    );
  }
}

// Singleton instance
export const reportRepository = new ReportRepository();
