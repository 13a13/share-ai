
import { supabase } from "@/integrations/supabase/client";
import { LOCAL_STORAGE_KEYS } from "@/lib/api/utils";
import { Property, Report, Room, RoomImage } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { uploadReportImage } from "./supabaseStorage";

/**
 * Migrate properties from localStorage to Supabase
 */
export const migratePropertiesToSupabase = async (): Promise<void> => {
  try {
    // Get properties from localStorage
    const localProperties = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.PROPERTIES) || '[]');
    if (localProperties.length === 0) return;

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if properties already exist in Supabase
    const { data: existingProps } = await supabase.from('properties').select('id');
    const existingIds = new Set(existingProps?.map(p => p.id) || []);

    // Filter to properties not already in Supabase
    const propertiesToMigrate = localProperties.filter((p: Property) => !existingIds.has(p.id));
    
    // If no properties to migrate, we're done
    if (propertiesToMigrate.length === 0) return;

    // Prepare properties for insertion with user_id
    const propertiesToInsert = propertiesToMigrate.map((p: Property) => {
      // Format location string from address components
      const location = `${p.address}, ${p.city}, ${p.state}, ${p.zipCode}`;
      
      // Format description to include bedrooms and bathrooms
      const description = `Bedrooms: ${p.bedrooms}, Bathrooms: ${p.bathrooms}`;
      
      return {
        id: p.id,
        user_id: user.id,
        name: p.name || '',
        location: location,
        type: p.propertyType || 'house',
        description: description,
        image_url: p.imageUrl || '',
        created_at: new Date(p.createdAt),
        updated_at: new Date(p.updatedAt)
      };
    });

    // Insert properties into Supabase
    const { error } = await supabase.from('properties').insert(propertiesToInsert);
    if (error) throw error;

    console.log(`Migrated ${propertiesToInsert.length} properties to Supabase`);
  } catch (error) {
    console.error('Error migrating properties to Supabase:', error);
  }
};

/**
 * Migrate reports from localStorage to Supabase
 */
export const migrateReportsToSupabase = async (): Promise<void> => {
  try {
    // Get reports from localStorage
    const localReports = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.REPORTS) || '[]');
    if (localReports.length === 0) return;

    // Check if reports already exist in Supabase
    const { data: existingReports } = await supabase.from('reports').select('id');
    const existingReportIds = new Set(existingReports?.map(r => r.id) || []);

    // Filter to reports not already in Supabase
    const reportsToMigrate = localReports.filter((r: Report) => !existingReportIds.has(r.id));
    
    // If no reports to migrate, we're done
    if (reportsToMigrate.length === 0) return;

    // Prepare reports for insertion
    const reportsToInsert = reportsToMigrate.map((r: Report) => ({
      id: r.id,
      propertyId: r.propertyId,
      name: r.name || null,
      type: r.type,
      status: r.status,
      reportInfo: r.reportInfo || null,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      completedAt: r.completedAt ? new Date(r.completedAt) : null
    }));

    // Insert reports into Supabase
    const { error: reportError } = await supabase.from('reports').insert(reportsToInsert);
    if (reportError) throw reportError;

    console.log(`Migrated ${reportsToInsert.length} reports to Supabase`);
    
    // Now migrate rooms for each report
    for (const report of reportsToMigrate) {
      await migrateRoomsForReport(report);
    }
  } catch (error) {
    console.error('Error migrating reports to Supabase:', error);
  }
};

/**
 * Migrate rooms for a specific report
 */
const migrateRoomsForReport = async (report: Report): Promise<void> => {
  try {
    // Check if rooms already exist for this report
    const { data: existingRooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('reportId', report.id);
    
    if (existingRooms && existingRooms.length > 0) {
      console.log(`Rooms for report ${report.id} already migrated`);
      return;
    }
    
    // Prepare rooms for insertion
    const roomsToInsert = report.rooms.map((room: Room) => ({
      id: room.id,
      reportId: report.id,
      name: room.name,
      type: room.type,
      order_index: room.order,
      generalCondition: room.generalCondition || null,
      sections: room.sections || [],
      components: room.components || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert rooms
    const { error: roomsError } = await supabase.from('rooms').insert(roomsToInsert);
    if (roomsError) throw roomsError;

    console.log(`Migrated ${roomsToInsert.length} rooms for report ${report.id}`);

    // Migrate images for each room
    for (const room of report.rooms) {
      if (room.images && room.images.length > 0) {
        await migrateImagesForRoom(report, room);
      }
    }
  } catch (error) {
    console.error(`Error migrating rooms for report ${report.id}:`, error);
  }
};

/**
 * Migrate images for a specific room
 */
const migrateImagesForRoom = async (report: Report, room: Room): Promise<void> => {
  try {
    // Get property details for folder structure
    const { data: property } = await supabase
      .from('properties')
      .select('address, city, state')
      .eq('id', report.propertyId)
      .single();
    
    if (!property) {
      console.error(`Property ${report.propertyId} not found for room ${room.id}`);
      return;
    }

    for (const image of room.images) {
      try {
        // Upload image to Supabase Storage
        const newUrl = await uploadReportImage(
          image.url, 
          report.id, 
          `${property.address}, ${property.city}, ${property.state}`, 
          report.type
        );

        if (!newUrl) {
          console.error(`Failed to upload image ${image.id} for room ${room.id}`);
          continue;
        }

        // Insert image record
        const { error: imageError } = await supabase.from('room_images').insert({
          id: image.id,
          roomId: room.id,
          url: newUrl,
          aiProcessed: image.aiProcessed || false,
          analysis: image.aiData || null,
          timestamp: new Date(image.timestamp)
        });

        if (imageError) throw imageError;
      } catch (err) {
        console.error(`Error migrating image ${image.id}:`, err);
      }
    }

    console.log(`Migrated ${room.images.length} images for room ${room.id}`);
  } catch (error) {
    console.error(`Error migrating images for room ${room.id}:`, error);
  }
};

/**
 * Run the full migration process
 */
export const runFullMigration = async (): Promise<void> => {
  try {
    console.log('Starting migration to Supabase...');
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Cannot migrate data - user not authenticated');
      return;
    }
    
    // Run migrations in sequence
    await migratePropertiesToSupabase();
    await migrateReportsToSupabase();
    
    console.log('Migration to Supabase complete');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
