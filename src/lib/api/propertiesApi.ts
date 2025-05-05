
import { Property } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Properties API
export const PropertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('createdAt', { ascending: false });
      
    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
    
    // Transform database structure to match our client model
    const properties: Property[] = data?.map(item => ({
      id: item.id,
      name: item.name || '',
      address: item.address,
      city: item.city,
      state: item.state,
      zipCode: item.zipCode,
      propertyType: item.type as any,
      bedrooms: item.bedrooms || 0,
      bathrooms: item.bathrooms || 0,
      squareFeet: 0, // Not in database schema, default value
      imageUrl: item.description || '',
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    })) || [];
    
    return properties;
  },
  
  getById: async (id: string): Promise<Property | null> => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching property:', error);
      throw error;
    }
    
    if (!data) return null;
    
    // Transform to match our client model
    const property: Property = {
      id: data.id,
      name: data.name || '',
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      propertyType: data.type as any,
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      squareFeet: 0, // Not in database schema, default value
      imageUrl: data.description || '',
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
    
    return property;
  },
  
  create: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    const newProperty = {
      id: uuidv4(),
      name: property.name || '',
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      type: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      description: property.imageUrl || ''
    };
    
    const { data, error } = await supabase
      .from('properties')
      .insert(newProperty)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating property:', error);
      throw error;
    }
    
    // Transform to match our client model
    return {
      id: data.id,
      name: data.name || '',
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      propertyType: data.type as any,
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      squareFeet: 0, // Not in database schema, default value
      imageUrl: data.description || '',
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  },
  
  update: async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    // Transform our client model to database structure
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.zipCode !== undefined) dbUpdates.zipCode = updates.zipCode;
    if (updates.propertyType !== undefined) dbUpdates.type = updates.propertyType;
    if (updates.bedrooms !== undefined) dbUpdates.bedrooms = updates.bedrooms;
    if (updates.bathrooms !== undefined) dbUpdates.bathrooms = updates.bathrooms;
    if (updates.imageUrl !== undefined) dbUpdates.description = updates.imageUrl;
    
    dbUpdates.updatedAt = new Date();
    
    const { data, error } = await supabase
      .from('properties')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating property:', error);
      throw error;
    }
    
    // Transform to match our client model
    return {
      id: data.id,
      name: data.name || '',
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      propertyType: data.type as any,
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      squareFeet: 0, // Not in database schema, default value
      imageUrl: data.description || '',
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  },
  
  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
    
    return true;
  }
};
