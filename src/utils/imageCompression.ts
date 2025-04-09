
/**
 * Compresses an image from a data URL
 * @param dataUrl The data URL of the image to compress
 * @param fileName Optional file name
 * @param quality JPEG quality (0.0 to 1.0)
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @returns A Promise resolving to the compressed data URL
 */
export const compressDataURLImage = async (
  dataUrl: string, 
  fileName: string = "image.jpg",
  quality: number = 0.7,
  maxWidth: number = 1280,
  maxHeight: number = 1280
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create an image element to load the data URL
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }
      
      // Create a canvas to draw the resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed data URL
      // Determine file type from fileName or use JPEG as default
      let mimeType = 'image/jpeg';
      if (fileName.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (fileName.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp';
      }
      
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = dataUrl;
  });
};

/**
 * Convert a File object to a data URL
 * @param file The file to convert
 * @returns A Promise resolving to the data URL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compress an image file
 * @param file The image file to compress
 * @param quality JPEG quality (0.0 to 1.0)
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @returns A Promise resolving to a compressed data URL
 */
export const compressImageFile = async (
  file: File,
  quality: number = 0.7,
  maxWidth: number = 1280,
  maxHeight: number = 1280
): Promise<string> => {
  try {
    const dataUrl = await fileToDataURL(file);
    return await compressDataURLImage(dataUrl, file.name, quality, maxWidth, maxHeight);
  } catch (error) {
    console.error('Error compressing image file:', error);
    throw error;
  }
};
