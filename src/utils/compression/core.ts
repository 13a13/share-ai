
/**
 * Core image compression functionality
 */

// Default compression settings
export const DEFAULT_MAX_WIDTH = 1920;
export const DEFAULT_MAX_HEIGHT = 1080;
export const DEFAULT_QUALITY = 0.8;

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if needed
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Compresses an image using canvas
 */
export const compressImageWithCanvas = (
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Calculate new dimensions
    const { width: newWidth, height: newHeight } = calculateDimensions(
      img.width,
      img.height,
      maxWidth,
      maxHeight
    );

    // Set canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Draw image on canvas
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Convert to data URL with error handling
    try {
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    } catch (error) {
      reject(error);
    }
  });
};
