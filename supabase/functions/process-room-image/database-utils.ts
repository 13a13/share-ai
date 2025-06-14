
// Re-export all functions from the modular files for backward compatibility
export type { PropertyRoomInfo } from './property-room-queries.ts';

export { 
  getUserAccountName, 
  cleanNameForFolder 
} from './user-utils.ts';

export { 
  getPropertyAndRoomInfo 
} from './property-room-queries.ts';

export { 
  createFolderHierarchy, 
  needsFolderCorrection 
} from './folder-operations.ts';

export { 
  organizeImageIntoFolders,
  buildCorrectStoragePath,
  moveFileToCorrectFolder 
} from './image-organization.ts';
