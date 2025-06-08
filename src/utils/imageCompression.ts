
/**
 * Image compression utility functions
 */

// Default compression settings
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1080;
const DEFAULT_QUALITY = 0.8;

/**
 * Compresses an image file
 */
export const compressImage = async (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<File> => {
  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
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

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to blob with error handling for tainted canvas
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.warn('Canvas toBlob failed, returning original file');
              resolve(file);
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        console.warn('Image compression failed, returning original file:', error);
        resolve(file);
      }
    };

    img.onerror = () => {
      console.warn('Image load failed, returning original file');
      resolve(file);
    };

    // Handle CORS by setting crossOrigin before setting src
    img.crossOrigin = 'anonymous';
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compresses an image from a data URL
 */
export const compressImageFromDataUrl = async (
  dataUrl: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<string> => {
  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
  } = options;

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
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

        if (!ctx) {
          console.warn('Failed to get canvas context, returning original');
          resolve(dataUrl);
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Try to convert to data URL with error handling
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (error) {
          console.warn('Canvas toDataURL failed (likely CORS), returning original:', error);
          resolve(dataUrl);
        }
      } catch (error) {
        console.warn('Image compression failed, returning original:', error);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      console.warn('Image load failed, returning original');
      resolve(dataUrl);
    };

    // Handle CORS properly
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
  });
};

/**
 * Compresses an image file and returns a data URL
 */
export const compressImageFile = async (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<string> => {
  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
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

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to data URL with error handling for tainted canvas
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (error) {
          console.warn('Canvas toDataURL failed (likely CORS), falling back to file reader:', error);
          // Fallback to file reader
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
        }
      } catch (error) {
        console.warn('Image compression failed, falling back to file reader:', error);
        // Fallback to file reader
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
      }
    };

    img.onerror = () => {
      console.warn('Image load failed, falling back to file reader');
      // Fallback to file reader
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
    };

    // Handle CORS by setting crossOrigin before setting src
    img.crossOrigin = 'anonymous';
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compresses a data URL image with optional filename
 */
export const compressDataURLImage = async (
  dataUrl: string,
  filename?: string,
  maxWidth: number = DEFAULT_MAX_WIDTH,
  maxHeight: number = DEFAULT_MAX_HEIGHT,
  quality: number = DEFAULT_QUALITY
): Promise<string> => {
  return compressImageFromDataUrl(dataUrl, {
    maxWidth,
    maxHeight,
    quality
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
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
