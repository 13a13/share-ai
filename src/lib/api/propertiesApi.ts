
import { Property } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Properties API
export const PropertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('updatedAt', { ascending: false });
      
    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
    
    return data || [];
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
    
    return data || null;
  },
  
  create: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    const newProperty = {
      ...property,
      id: uuidv4(), // We'll still generate the UUID client-side
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
    
    return data;
  },
  
  update: async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    const { data, error } = await supabase
      .from('properties')
      .update({
        ...updates,
        updatedAt: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating property:', error);
      throw error;
    }
    
    return data;
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
