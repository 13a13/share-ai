
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

    // We don't have a reports table in Supabase yet
    // Instead, we'll check the existing inspections
    const { data: existingInspections } = await supabase.from('inspections').select('id');
    const existingIds = new Set(existingInspections?.map(r => r.id) || []);

    // Filter to reports not already in Supabase
    const reportsToMigrate = localReports.filter((r: Report) => !existingIds.has(r.id));
    
    // If no reports to migrate, we're done
    if (reportsToMigrate.length === 0) return;

    // We'll migrate each report by creating a room and inspection in Supabase
    for (const report of reportsToMigrate) {
      await migrateReportToSupabase(report);
    }

    console.log(`Migrated ${reportsToMigrate.length} reports to Supabase`);
  } catch (error) {
    console.error('Error migrating reports to Supabase:', error);
  }
};

/**
 * Migrate a single report to Supabase (creating room and inspection)
 */
const migrateReportToSupabase = async (report: Report): Promise<void> => {
  try {
    // For each report we need to create a room
    for (const room of report.rooms) {
      // Create the room in Supabase
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          id: room.id,
          property_id: report.propertyId,
          type: room.type
        })
        .select()
        .single();
      
      if (roomError) {
        console.error(`Error creating room for report ${report.id}:`, roomError);
        continue;
      }
      
      // Create the inspection in Supabase
      const { error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          id: report.id,
          room_id: room.id,
          status: report.status,
          report_url: report.reportInfo?.additionalInfo || '',
          date: report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate) : new Date(),
          created_at: new Date(report.createdAt),
          updated_at: new Date(report.updatedAt)
        });
      
      if (inspectionError) {
        console.error(`Error creating inspection for report ${report.id}:`, inspectionError);
        continue;
      }
      
      // Migrate images for the room
      await migrateImagesForRoom(report, room);
    }
  } catch (error) {
    console.error(`Error migrating report ${report.id}:`, error);
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
      .select('*')
      .eq('id', report.propertyId)
      .single();
    
    if (!property) {
      console.error(`Property ${report.propertyId} not found for room ${room.id}`);
      return;
    }

    // Extract address components
    const location = property.location || '';
    const addressParts = location.split(',').map(part => part.trim());
    const address = addressParts[0] || '';
    const city = addressParts[1] || '';
    const state = addressParts[2] || '';

    for (const image of room.images) {
      try {
        // Upload image to Supabase Storage
        const newUrl = await uploadReportImage(
          image.url, 
          report.id, 
          `${address}, ${city}, ${state}`, 
          report.type
        );

        if (!newUrl) {
          console.error(`Failed to upload image ${image.id} for room ${room.id}`);
          continue;
        }

        // Insert image record
        const { error: imageError } = await supabase.from('inspection_images').insert({
          id: image.id,
          inspection_id: report.id,
          image_url: newUrl,
          analysis: image.aiData || null
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
