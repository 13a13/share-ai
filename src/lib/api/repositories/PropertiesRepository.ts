/**
 * Step 1: Properties Repository
 * 
 * Centralized data access layer for properties with:
 * - Automatic telemetry tracking
 * - Retry logic for mutations
 * - Type-safe operations
 * - Consistent error handling
 */

import { supabase } from '@/integrations/supabase/client';
import type { Property } from '@/types';
import { BaseRepository } from './BaseRepository';
import { PropertyMapper } from '../mappers/PropertyMapper';
import { NotFoundError, UnauthorizedError } from '../errors/ApiErrors';
import { CreatePropertySchema, UpdatePropertySchema } from '../validation/schemas';

export class PropertiesRepository extends BaseRepository<Property> {
  /**
   * Find all properties for the authenticated user
   */
  async findAll(): Promise<Property[]> {
    const data = await this.executeQuery<any[]>(
      async () => await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false }),
      'PropertiesRepository.findAll'
    );
    return data.map(PropertyMapper.toClientModel);
  }

  /**
   * Find a property by ID
   */
  async findById(id: string): Promise<Property | null> {
    const data = await this.executeQuery<any>(
      async () => await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle(),
      'PropertiesRepository.findById'
    );
    
    if (!data) {
      return null;
    }

    return PropertyMapper.toClientModel(data);
  }

  /**
   * Create a new property
   */
  async create(property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    // Validate input
    this.validateInput(CreatePropertySchema, property);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new UnauthorizedError('User not authenticated. Please sign in to create properties.');
    }

    // Transform to database format
    const dbProperty = PropertyMapper.toDatabaseInsert(property, user.id);

    // Execute with retry
    const data = await this.executeMutation<any>(
      async () => await supabase
        .from('properties')
        .insert(dbProperty)
        .select()
        .single(),
      'PropertiesRepository.create'
    );
    return PropertyMapper.toClientModel(data);
  }

  /**
   * Update an existing property
   */
  async update(id: string, updates: Partial<Property>): Promise<Property> {
    // Validate input
    this.validateInput(UpdatePropertySchema, updates);

    // Transform to database format
    const dbUpdates = PropertyMapper.toDatabaseUpdate(updates);

    // Execute with retry
    const data = await this.executeMutation<any>(
      async () => await supabase
        .from('properties')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single(),
      'PropertiesRepository.update'
    );
    
    if (!data) {
      throw new NotFoundError('Property', id);
    }

    return PropertyMapper.toClientModel(data);
  }

  /**
   * Delete a property
   */
  async delete(id: string): Promise<void> {
    const data = await this.executeMutation<any>(
      async () => await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .select()
        .single(),
      'PropertiesRepository.delete'
    );
    
    if (!data) {
      throw new NotFoundError('Property', id);
    }
  }

  /**
   * Check if user has reached property limit
   */
  async checkPropertyLimit(userId: string): Promise<{
    current: number;
    limit: number;
    canCreate: boolean;
  }> {
    // Get user's current property count
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Get user's property limit from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('property_limit')
      .eq('id', userId)
      .single();

    const limit = profile?.property_limit || 50;
    const current = count || 0;

    return {
      current,
      limit,
      canCreate: current < limit,
    };
  }
}

// Singleton instance
export const propertiesRepository = new PropertiesRepository();
