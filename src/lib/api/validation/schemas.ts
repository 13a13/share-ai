/**
 * Step 0: Validation Schemas
 * 
 * Centralized Zod schemas for validating API inputs.
 * Used by repositories to ensure data integrity before database operations.
 */

import { z } from 'zod';

// Property Schemas
export const PropertySchema = z.object({
  name: z.string().min(1, 'Property name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
  country: z.string().min(1, 'Country is required').max(100),
  bedrooms: z.number().int().min(0).max(100),
  bathrooms: z.number().min(0).max(100),
  squareFeet: z.number().int().min(0).optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 1).optional(),
  propertyType: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const CreatePropertySchema = PropertySchema.omit({ 
  // Properties are auto-generated
});

export const UpdatePropertySchema = PropertySchema.partial();

// Report Schemas
export const ReportTypeSchema = z.enum([
  'check_in',
  'check_out',
  'inventory',
  'inspection',
  'comparison'
]);

export const ReportStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'archived'
]);

export const CreateReportSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  type: ReportTypeSchema,
  date: z.string().datetime().optional(),
});

export const UpdateReportSchema = z.object({
  status: ReportStatusSchema.optional(),
  reportInfo: z.any().optional(), // JSON data
  reportUrl: z.string().url().optional().nullable(),
}).partial();

// Room Schemas
export const RoomTypeSchema = z.enum([
  'living_room',
  'bedroom',
  'kitchen',
  'bathroom',
  'dining_room',
  'hallway',
  'office',
  'garage',
  'basement',
  'attic',
  'laundry_room',
  'other'
]);

export const CreateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: RoomTypeSchema,
  propertyId: z.string().uuid(),
});

export const UpdateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: RoomTypeSchema.optional(),
}).partial();

// Component Schemas
export const ConditionRatingSchema = z.enum([
  'excellent',
  'good',
  'fair',
  'poor',
  'damaged'
]);

export const ComponentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  condition: ConditionRatingSchema,
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  analysisData: z.any().optional(), // JSON data
});

export const UpdateComponentSchema = ComponentSchema.partial().extend({
  id: z.string(), // ID is required for updates
});

// Image Schemas
export const ImageUploadSchema = z.object({
  file: z.instanceof(File).or(z.instanceof(Blob)),
  roomId: z.string().uuid(),
  inspectionId: z.string().uuid(),
});

export const ImageUrlSchema = z.object({
  url: z.string().url(),
  roomId: z.string().uuid(),
  inspectionId: z.string().uuid(),
  analysis: z.any().optional(),
});

// Checkout Schemas
export const CheckoutDataSchema = z.object({
  date: z.string().datetime(),
  tenantName: z.string().min(1),
  tenantPresent: z.boolean(),
  clerkName: z.string().min(1),
  notes: z.string().optional(),
});

export const CheckoutComparisonSchema = z.object({
  id: z.string().uuid(),
  checkoutReportId: z.string().uuid(),
  checkinReportId: z.string().uuid(),
  roomId: z.string(),
  componentId: z.string(),
  componentName: z.string(),
  status: z.string(),
  checkoutCondition: ConditionRatingSchema.optional().nullable(),
  changeDescription: z.string().optional().nullable(),
  checkoutImages: z.any().optional(), // JSON array
  aiAnalysis: z.any().optional(), // JSON object
});

// Telemetry Schemas
export const TelemetryEventSchema = z.object({
  operation: z.string().min(1),
  resource: z.string().min(1),
  duration_ms: z.number().int().min(0),
  status: z.enum(['success', 'error']),
  error_class: z.string().optional(),
  error_message: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Helper function to validate data
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorContext?: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new Error(
      `Validation failed${errorContext ? ` for ${errorContext}` : ''}: ${firstError.path.join('.')} - ${firstError.message}`
    );
  }
  
  return result.data;
}
