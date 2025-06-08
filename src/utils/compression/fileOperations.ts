
/**
 * File operation utilities for image compression
 */

/**
 * Validates if a file is a valid image
 */
export const isValidImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Converts file to data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Creates a File object from a blob
 */
export const createFileFromBlob = (blob: Blob, filename: string): File => {
  return new File([blob], filename, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
};

/**
 * Fallback file reader for when canvas operations fail
 */
export const fallbackFileReader = (file: File): Promise<string> => {
  console.warn('Using fallback file reader');
  return fileToDataUrl(file);
};
