
/**
 * Main image compression functions
 */

import { DEFAULT_MAX_WIDTH, DEFAULT_MAX_HEIGHT, DEFAULT_QUALITY, compressImageWithCanvas } from './core';
import { fileToDataUrl, createFileFromBlob, fallbackFileReader } from './fileOperations';

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
        compressImageWithCanvas(img, maxWidth, maxHeight, quality)
          .then((compressedDataUrl) => {
            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  console.warn('Canvas toBlob failed, returning original file');
                  resolve(file);
                  return;
                }

                const compressedFile = createFileFromBlob(blob, file.name);
                resolve(compressedFile);
              },
              'image/jpeg',
              quality
            );
          })
          .catch(() => {
            console.warn('Image compression failed, returning original file');
            resolve(file);
          });
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
    const img = new Image();

    img.onload = () => {
      try {
        compressImageWithCanvas(img, maxWidth, maxHeight, quality)
          .then((compressedDataUrl) => {
            resolve(compressedDataUrl);
          })
          .catch((error) => {
            console.warn('Image compression failed, returning original:', error);
            resolve(dataUrl);
          });
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
    const img = new Image();

    img.onload = () => {
      try {
        compressImageWithCanvas(img, maxWidth, maxHeight, quality)
          .then((compressedDataUrl) => {
            resolve(compressedDataUrl);
          })
          .catch((error) => {
            console.warn('Canvas compression failed, falling back to file reader:', error);
            fallbackFileReader(file)
              .then(resolve)
              .catch(reject);
          });
      } catch (error) {
        console.warn('Image compression failed, falling back to file reader:', error);
        fallbackFileReader(file)
          .then(resolve)
          .catch(reject);
      }
    };

    img.onerror = () => {
      console.warn('Image load failed, falling back to file reader');
      fallbackFileReader(file)
        .then(resolve)
        .catch(reject);
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
