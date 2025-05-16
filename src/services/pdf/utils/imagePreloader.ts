
import { Report } from "@/types";
import { isIosDevice } from "@/utils/pdfUtils";

/**
 * Preload all images from the report to ensure they're cached
 * Uses a dynamic timeout based on image count and device capabilities
 */
export const preloadImages = async (report: Report): Promise<void> => {
  const imagePromises: Promise<void>[] = [];
  
  // Gather all image URLs from the report
  const imageUrls: string[] = [];
  
  // Add room images
  report.rooms.forEach(room => {
    if (room.images && room.images.length > 0) {
      room.images.forEach(img => {
        if (img.url && img.url.trim() !== '') {
          imageUrls.push(img.url);
        }
      });
    }
    
    // Add component images
    if (room.components && room.components.length > 0) {
      room.components.forEach(component => {
        if (component.images && component.images.length > 0) {
          component.images.forEach(img => {
            if (img.url && img.url.trim() !== '') {
              imageUrls.push(img.url);
            }
          });
        }
      });
    }
  });
  
  // Skip if no images to preload
  if (imageUrls.length === 0) {
    return;
  }
  
  // Calculate dynamic timeout based on number of images and device
  const timeout = calculateDynamicTimeout(imageUrls.length);
  
  console.log(`Dynamic image preload timeout set to ${timeout}ms for ${imageUrls.length} images`);
  
  // Track preloaded images for retry logic
  const preloadedImages = new Set<string>();
  const failedImages = new Set<string>();
  
  // Preload each image
  imageUrls.forEach(url => {
    const promise = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        preloadedImages.add(url);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`);
        failedImages.add(url);
        resolve(); // Resolve anyway to continue the process
      };
      img.src = url;
    });
    
    imagePromises.push(promise);
  });
  
  // Wait for all images to preload (or fail) with dynamic timeout
  const timeoutPromise = new Promise<void>(resolve => setTimeout(() => {
    const loadedCount = preloadedImages.size;
    const failedCount = failedImages.size;
    const totalCount = imageUrls.length;
    
    console.log(`Preload timed out: ${loadedCount}/${totalCount} images loaded, ${failedCount} failed`);
    resolve();
  }, timeout));
  
  await Promise.race([
    Promise.all(imagePromises),
    timeoutPromise
  ]);
  
  // Try one more time with failed images if there aren't too many
  await retryFailedImages(failedImages);
  
  const finalLoadedCount = preloadedImages.size;
  console.log(`Preloaded ${finalLoadedCount}/${imageUrls.length} images`);
  
  // iOS-specific warning for large numbers of images
  if (isIosDevice() && imageUrls.length > 50) {
    console.warn(`Large number of images (${imageUrls.length}) may cause performance issues on iOS`);
  }
};

/**
 * Calculate dynamic timeout based on image count and device type
 */
function calculateDynamicTimeout(imageCount: number): number {
  // iOS devices may need more time due to performance constraints
  const baseTimeout = 5000; // Base 5 seconds
  const perImageTime = 500; // 0.5 second per image
  const iosMultiplier = isIosDevice() ? 1.5 : 1; // 50% more time for iOS
  
  return Math.min(
    30000, // Cap at 30 seconds max
    Math.max(
      baseTimeout,
      (imageCount * perImageTime * iosMultiplier) + baseTimeout
    )
  );
}

/**
 * Retry loading failed images
 */
async function retryFailedImages(failedImages: Set<string>): Promise<void> {
  if (failedImages.size === 0 || failedImages.size > 5) {
    return;
  }
  
  console.log(`Retrying ${failedImages.size} failed images...`);
  const retryPromises = Array.from(failedImages).map(url => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log(`Successfully loaded image on retry: ${url}`);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load image on retry: ${url}`);
        resolve();
      };
      img.src = url;
    });
  });
  
  // Short timeout for retry attempts
  const retryTimeout = new Promise<void>(resolve => 
    setTimeout(resolve, Math.min(3000, failedImages.size * 1000))
  );
  
  await Promise.race([
    Promise.all(retryPromises),
    retryTimeout
  ]);
}
