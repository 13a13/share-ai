
/**
 * Simplified AI Processing Options for Gemini 2.5 Pro exclusive use
 */

export interface AIProcessingOptions {
  componentName?: string;
  roomType: string;
  inventoryMode?: boolean;
  useAdvancedAnalysis?: boolean;
  imageCount: number;
}

/**
 * Default processing options optimized for Gemini 2.5 Pro
 */
export const DEFAULT_PROCESSING_OPTIONS: Partial<AIProcessingOptions> = {
  inventoryMode: true,
  useAdvancedAnalysis: true, // Always leverage Gemini 2.5 Pro's capabilities
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
