
// Legacy file - re-exports from the new modular storage utilities
// This file maintains backward compatibility while the new structure with retry logic is adopted

export {
  uploadReportImage,
  uploadMultipleReportImages,
  deleteReportImage,
  checkStorageBucket,
  // Export retry utilities for advanced use cases
  withRetry,
  STORAGE_RETRY_CONFIG,
  BATCH_RETRY_CONFIG
} from './storage';
