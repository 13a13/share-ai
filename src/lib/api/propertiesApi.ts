/**
 * Properties API - Legacy Facade
 * @deprecated Use ApiV1.properties or PropertiesRepository directly
 * This API will be removed in v2.0
 */

import { Property } from '@/types';
import { propertiesRepository } from './repositories/PropertiesRepository';

// Properties API - now a pure facade powered by repository pattern
export const PropertiesAPI = {
  getAll: () => propertiesRepository.findAll(),
  
  getById: (id: string) => propertiesRepository.findById(id),
  
  create: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => 
    propertiesRepository.create(property),
  
  update: (id: string, updates: Partial<Property>) => 
    propertiesRepository.update(id, updates),
  
  delete: async (id: string): Promise<boolean> => {
    await propertiesRepository.delete(id);
    return true;
  },

  checkPropertyLimit: (userId: string) => 
    propertiesRepository.checkPropertyLimit(userId),
};
