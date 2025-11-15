/**
 * Step 1: Property Mapper
 * 
 * Transforms between database schema and client Property model.
 * Preserves complex regex-based parsing from original propertiesApi.ts
 */

import type { Property } from '@/types';
import type { Database } from '@/integrations/supabase/types';

type PropertyRow = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

export class PropertyMapper {
  /**
   * Transform database row to client Property model
   * Preserves original regex parsing logic from propertiesApi.ts lines 21-35
   */
  static toClientModel(dbProperty: PropertyRow): Property {
    return {
      id: dbProperty.id,
      name: dbProperty.name || '',
      address: dbProperty.location ? dbProperty.location.split(',')[0]?.trim() : '',
      city: dbProperty.location ? dbProperty.location.split(',')[1]?.trim() : '',
      state: dbProperty.location ? dbProperty.location.split(',')[2]?.trim() : '',
      zipCode: dbProperty.location ? dbProperty.location.split(',')[3]?.trim() : '',
      propertyType: dbProperty.type as any,
      bedrooms: Number(dbProperty.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(dbProperty.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0, // Not in database schema
      yearBuilt: undefined, // Not in database schema
      imageUrl: dbProperty.image_url || '',
      createdAt: new Date(dbProperty.created_at),
      updatedAt: new Date(dbProperty.updated_at),
    };
  }

  /**
   * Transform client Property model to database insert format
   * Preserves original formatting logic from propertiesApi.ts lines 80-96
   */
  static toDatabaseInsert(
    property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): PropertyInsert {
    // Format the description to store bedrooms and bathrooms
    const description = `Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}, ${property.imageUrl || ''}`;
    
    // Format the location to store address, city, state, and zipCode
    const location = `${property.address}, ${property.city}, ${property.state}, ${property.zipCode}`;
    
    return {
      name: property.name || '',
      location: location,
      type: property.propertyType,
      description: description,
      image_url: property.imageUrl || '',
      user_id: userId,
    };
  }

  /**
   * Transform client Property model to database update format
   */
  static toDatabaseUpdate(
    property: Partial<Property>
  ): Partial<Omit<PropertyInsert, 'user_id'>> {
    const update: Partial<Omit<PropertyInsert, 'user_id'>> = {};

    if (property.name !== undefined) {
      update.name = property.name;
    }

    if (property.address || property.city || property.state || property.zipCode) {
      const location = `${property.address || ''}, ${property.city || ''}, ${property.state || ''}, ${property.zipCode || ''}`;
      update.location = location;
    }

    if (property.propertyType !== undefined) {
      update.type = property.propertyType;
    }

    if (property.bedrooms !== undefined || property.bathrooms !== undefined || property.imageUrl !== undefined) {
      const description = `Bedrooms: ${property.bedrooms || 0}, Bathrooms: ${property.bathrooms || 0}, ${property.imageUrl || ''}`;
      update.description = description;
    }

    if (property.imageUrl !== undefined) {
      update.image_url = property.imageUrl || '';
    }

    return update;
  }
}
