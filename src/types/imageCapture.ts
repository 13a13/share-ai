
// Type definitions for image capture functionality
export interface ImageCaptureHandlers {
  // Overloaded signatures for backward compatibility
  onImageCapture(imageData: string): void;
  onImageCapture(imageData: string[]): void;
  onImageCapture(imageData: string | string[]): void;
}

// Utility type guards
export const isImageArray = (data: string | string[]): data is string[] => Array.isArray(data);

export const normalizeImageInput = (data: string | string[]): string[] => 
  Array.isArray(data) ? data : [data];
