
import imageCompression from "browser-image-compression";

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compresses an image for efficient storage and API transmission
 */
export const compressImage = async (
  imageFile: File | Blob,
  fileName = "compressed-image.jpg"
): Promise<CompressionResult> => {
  // If it's already a small file, don't compress further
  const originalSize = imageFile.size / 1024 / 1024; // in MB
  
  // Set compression options to target <500KB with max width of 1280px
  const options = {
    maxSizeMB: 0.5, // 500KB
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    initialQuality: 0.8,
  };

  try {
    // Compress the image
    const compressedFile = await imageCompression(imageFile, options);
    
    // Calculate compressed size and ratio
    const compressedSize = compressedFile.size / 1024 / 1024; // in MB
    const compressionRatio = (1 - compressedSize / originalSize) * 100;
    
    console.log(
      `Image compression: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(
        2
      )}MB (${compressionRatio.toFixed(0)}% reduction)`
    );

    return {
      compressedFile: new File([compressedFile], fileName, {
        type: compressedFile.type,
      }),
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    console.error("Error compressing image:", error);
    // If compression fails, return the original file with 0% compression
    return {
      compressedFile: new File([imageFile], fileName, {
        type: imageFile.type || "image/jpeg",
      }),
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }
};

/**
 * Converts a data URL to a Blob
 */
export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * Compresses an image from a data URL
 */
export const compressDataURLImage = async (
  dataURL: string,
  fileName = "compressed-image.jpg"
): Promise<string> => {
  try {
    // Convert data URL to blob
    const blob = dataURLToBlob(dataURL);
    
    // Compress the blob
    const { compressedFile } = await compressImage(blob, fileName);
    
    // Convert compressed file back to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error("Error compressing data URL image:", error);
    return dataURL; // Return original if compression fails
  }
};
