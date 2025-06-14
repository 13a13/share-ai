
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
