
/**
 * Compresses an image file to a specified quality and max dimensions
 * @param file The image file to compress
 * @param maxWidth Maximum width of the compressed image (default: 1200)
 * @param maxHeight Maximum height of the compressed image (default: 1200)
 * @param quality JPEG quality between 0 and 1 (default: 0.7)
 * @returns A Promise that resolves to a compressed image as a data URL
 */
export const compressImageFile = async (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
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
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get the data URL as JPEG with the specified quality
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (error) {
          console.error("Error compressing image:", error);
          // If compression fails, return the original image
          resolve(img.src);
        }
      };
      
      img.onerror = (error) => {
        console.error("Error loading image:", error);
        reject(error);
      };
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      reject(error);
    };
  });
};

/**
 * Compresses an image from a data URL
 * @param dataUrl The data URL of the image to compress
 * @param fileName Optional filename for logging purposes
 * @param maxWidth Maximum width of the compressed image (default: 1200)
 * @param maxHeight Maximum height of the compressed image (default: 1200)
 * @param quality JPEG quality between 0 and 1 (default: 0.7)
 * @returns A Promise that resolves to a compressed image as a data URL
 */
export const compressDataURLImage = async (
  dataUrl: string,
  fileName: string = 'image.jpg',
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
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
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get the data URL as JPEG with the specified quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Log compression results
        if (dataUrl.length > compressedDataUrl.length) {
          console.log(`Compressed ${fileName}: ${(dataUrl.length / 1024).toFixed(2)}KB → ${(compressedDataUrl.length / 1024).toFixed(2)}KB (${Math.round((1 - compressedDataUrl.length / dataUrl.length) * 100)}% reduction)`);
        } else {
          console.log(`Note: ${fileName} could not be further compressed`);
        }
        
        resolve(compressedDataUrl);
      };
      
      img.onerror = (error) => {
        console.error(`Error loading image ${fileName}:`, error);
        // If compression fails, return the original data URL
        resolve(dataUrl);
      };
    } catch (error) {
      console.error(`Error compressing image ${fileName}:`, error);
      // If compression fails, return the original data URL
      resolve(dataUrl);
    }
  });
};
