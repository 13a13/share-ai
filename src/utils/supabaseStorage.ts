
// Legacy file - re-exports from the new modular storage utilities
// This file maintains backward compatibility while the new structure is adopted

export {
  uploadReportImage,
  uploadMultipleReportImages,
  deleteReportImage,
  checkStorageBucket
} from './storage';
