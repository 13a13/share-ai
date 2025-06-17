
// Main exports for storage utilities
export { getUserFullName } from './userUtils';
export { generateFolderPath, cleanNameForFolder } from './folderUtils';
export { 
  dataUrlToBlob, 
  getFileExtensionFromDataUrl, 
  uploadBlobToStorage, 
  deleteFileFromStorage, 
  extractFilePathFromUrl 
} from './storageUtils';
export { uploadReportImage, uploadMultipleReportImages } from './imageUploadUtils';
export { deleteReportImage } from './imageDeleteUtils';
export { checkStorageBucket } from './storageBucketUtils';
export { 
  withRetry, 
  DEFAULT_RETRY_CONFIG, 
  STORAGE_RETRY_CONFIG, 
  BATCH_RETRY_CONFIG,
  isRetryableError,
  calculateDelay,
  type RetryConfig,
  type RetryContext,
  type ProgressCallback
} from './retryUtils';
