
/**
 * Image compression utility functions
 * Re-exports from modular compression utilities
 */

// Export constants
export {
  DEFAULT_MAX_WIDTH,
  DEFAULT_MAX_HEIGHT,
  DEFAULT_QUALITY,
  calculateDimensions
} from './compression/core';

// Export file operations
export {
  isValidImageFile,
  fileToDataUrl
} from './compression/fileOperations';

// Export main compression functions
export {
  compressImage,
  compressImageFromDataUrl,
  compressImageFile,
  compressDataURLImage
} from './compression/compressors';
