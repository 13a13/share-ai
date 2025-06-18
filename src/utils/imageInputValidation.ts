
export interface ImageInputValidationResult {
  isValid: boolean;
  normalizedImages: string[];
  warnings: string[];
  errors: string[];
}

export const validateAndNormalizeImageInput = (
  input: string | string[] | undefined | null,
  context: string = 'unknown'
): ImageInputValidationResult => {
  const result: ImageInputValidationResult = {
    isValid: false,
    normalizedImages: [],
    warnings: [],
    errors: []
  };

  // Handle null/undefined
  if (!input) {
    result.errors.push(`No image data provided in ${context}`);
    return result;
  }

  // Handle empty arrays
  if (Array.isArray(input) && input.length === 0) {
    result.errors.push(`Empty image array provided in ${context}`);
    return result;
  }

  // Normalize to array
  const images = Array.isArray(input) ? input : [input];
  
  // Validate each image
  const validImages: string[] = [];
  images.forEach((img, index) => {
    if (typeof img !== 'string') {
      result.errors.push(`Image ${index} is not a string in ${context}`);
      return;
    }
    
    if (!img.trim()) {
      result.errors.push(`Image ${index} is empty in ${context}`);
      return;
    }
    
    if (!img.startsWith('data:image/') && !img.startsWith('http')) {
      result.warnings.push(`Image ${index} may not be a valid image URL in ${context}`);
    }
    
    validImages.push(img);
  });

  result.normalizedImages = validImages;
  result.isValid = validImages.length > 0 && result.errors.length === 0;
  
  if (validImages.length !== images.length) {
    result.warnings.push(`${images.length - validImages.length} invalid images filtered out in ${context}`);
  }

  return result;
};
