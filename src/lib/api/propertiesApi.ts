import { Property } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Properties API
export const PropertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
    
    // Transform database structure to match our client model
    const properties: Property[] = data?.map(item => ({
      id: item.id,
      name: item.name || '',
      address: item.location ? item.location.split(',')[0]?.trim() : '',
      city: item.location ? item.location.split(',')[1]?.trim() : '',
      state: item.location ? item.location.split(',')[2]?.trim() : '',
      zipCode: item.location ? item.location.split(',')[3]?.trim() : '',
      propertyType: item.type as any,
      bedrooms: Number(item.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(item.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0, // Not in database schema, default value
      imageUrl: item.image_url || '',
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
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
      address: data.location ? data.location.split(',')[0]?.trim() : '',
      city: data.location ? data.location.split(',')[1]?.trim() : '',
      state: data.location ? data.location.split(',')[2]?.trim() : '',
      zipCode: data.location ? data.location.split(',')[3]?.trim() : '',
      propertyType: data.type as any,
      bedrooms: Number(data.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(data.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0, // Not in database schema, default value
      imageUrl: data.image_url || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
    
    return property;
  },
  
  create: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    // Format the description to store bedrooms and bathrooms
    const description = `Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}, ${property.imageUrl || ''}`;
    
    // Format the location to store address, city, state, and zipCode
    const location = `${property.address}, ${property.city}, ${property.state}, ${property.zipCode}`;
    
    // Create the new property object for Supabase
    const newProperty = {
      id: uuidv4(),
      name: property.name || '',
      location: location,
      type: property.propertyType,
      description: description,
      image_url: property.imageUrl || '',
      user_id: (await supabase.auth.getUser()).data.user?.id
    };
    
    if (!newProperty.user_id) {
      throw new Error('User not authenticated. Please sign in to create properties.');
    }
    
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
      address: data.location ? data.location.split(',')[0]?.trim() : '',
      city: data.location ? data.location.split(',')[1]?.trim() : '',
      state: data.location ? data.location.split(',')[2]?.trim() : '',
      zipCode: data.location ? data.location.split(',')[3]?.trim() : '',
      propertyType: data.type as any,
      bedrooms: Number(data.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(data.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0, // Not in database schema, default value
      imageUrl: data.image_url || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },
  
  update: async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    // Transform our client model to database structure
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    
    // If any address fields are updated, update the location field
    if (updates.address !== undefined || updates.city !== undefined || 
        updates.state !== undefined || updates.zipCode !== undefined) {
      // Get current property to merge with updates
      const { data: currentProperty } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      
      if (currentProperty) {
        const currentAddressParts = currentProperty.location ? currentProperty.location.split(',').map(part => part.trim()) : ['', '', '', ''];
        const address = updates.address !== undefined ? updates.address : currentAddressParts[0] || '';
        const city = updates.city !== undefined ? updates.city : currentAddressParts[1] || '';
        const state = updates.state !== undefined ? updates.state : currentAddressParts[2] || '';
        const zipCode = updates.zipCode !== undefined ? updates.zipCode : currentAddressParts[3] || '';
        
        dbUpdates.location = `${address}, ${city}, ${state}, ${zipCode}`;
      }
    }
    
    if (updates.propertyType !== undefined) dbUpdates.type = updates.propertyType;
    
    // If bedrooms or bathrooms are updated, update the description
    if (updates.bedrooms !== undefined || updates.bathrooms !== undefined) {
      // Get current property to merge with updates
      const { data: currentProperty } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      
      if (currentProperty) {
        const currentBedrooms = Number(currentProperty.description?.match(/Bedrooms: (\d+)/)?.[1] || 0);
        const currentBathrooms = Number(currentProperty.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0);
        
        const bedrooms = updates.bedrooms !== undefined ? updates.bedrooms : currentBedrooms;
        const bathrooms = updates.bathrooms !== undefined ? updates.bathrooms : currentBathrooms;
        
        dbUpdates.description = `Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms}`;
        
        // Keep any additional description content
        if (currentProperty.description && !currentProperty.description.startsWith('Bedrooms:')) {
          dbUpdates.description = currentProperty.description;
        }
      }
    }
    
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    
    dbUpdates.updated_at = new Date();
    
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
      address: data.location ? data.location.split(',')[0]?.trim() : '',
      city: data.location ? data.location.split(',')[1]?.trim() : '',
      state: data.location ? data.location.split(',')[2]?.trim() : '',
      zipCode: data.location ? data.location.split(',')[3]?.trim() : '',
      propertyType: data.type as any,
      bedrooms: Number(data.description?.match(/Bedrooms: (\d+)/)?.[1] || 0),
      bathrooms: Number(data.description?.match(/Bathrooms: (\d+(?:\.\d+)?)/)?.[1] || 0),
      squareFeet: 0, // Not in database schema, default value
      imageUrl: data.image_url || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
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
