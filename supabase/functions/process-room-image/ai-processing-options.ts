
/**
 * Simplified AI Processing Options for universal prompt
 */

export interface AIProcessingOptions {
  componentName?: string;
  roomType: string;
  imageCount: number;
}

/**
 * Default processing options
 */
export const DEFAULT_PROCESSING_OPTIONS: Partial<AIProcessingOptions> = {
  componentName: 'component',
};

/**
 * Validate processing options
 */
export function validateProcessingOptions(options: AIProcessingOptions): string | null {
  if (!options.roomType) {
    return "Room type is required";
  }
  
  if (options.imageCount < 1) {
    return "At least one image is required";
  }
  
  if (options.imageCount > 20) {
    return "Maximum 20 images supported by Gemini 2.5 Pro";
  }
  
  return null;
}
