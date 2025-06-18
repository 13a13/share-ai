
export const debugImageFlow = {
  logCapture: (source: string, input: any, context: any = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`📸 Image Capture Debug: ${source}`);
      console.log('Input type:', typeof input);
      console.log('Input value:', input);
      console.log('Is array:', Array.isArray(input));
      console.log('Length:', Array.isArray(input) ? input.length : 'N/A');
      console.log('Context:', context);
      console.groupEnd();
    }
  },
  
  logProcessing: (stage: string, imageCount: number, context: any = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Image Processing [${stage}]: ${imageCount} images`, context);
    }
  },
  
  logError: (source: string, error: any, context: any = {}) => {
    console.error(`❌ Image Error [${source}]:`, error, context);
  }
};
