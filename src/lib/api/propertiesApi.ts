
import { Property } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { LOCAL_STORAGE_KEYS, initializeLocalStorage } from './utils';

// Properties API
export const PropertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    initializeLocalStorage();
    const properties = localStorage.getItem(LOCAL_STORAGE_KEYS.PROPERTIES);
    return JSON.parse(properties || '[]');
  },
  
  getById: async (id: string): Promise<Property | null> => {
    const properties = await PropertiesAPI.getAll();
    return properties.find(p => p.id === id) || null;
  },
  
  create: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    const properties = await PropertiesAPI.getAll();
    const newProperty: Property = {
      ...property,
      name: property.name || property.address, // Use address as fallback if name not provided
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    properties.push(newProperty);
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
    return newProperty;
  },
  
  update: async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    const properties = await PropertiesAPI.getAll();
    const index = properties.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    const updatedProperty = {
      ...properties[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    properties[index] = updatedProperty;
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
    return updatedProperty;
  },
};
