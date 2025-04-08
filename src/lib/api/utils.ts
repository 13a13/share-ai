
// Storage keys for local data persistence
export const LOCAL_STORAGE_KEYS = {
  PROPERTIES: 'shareai-properties',
  REPORTS: 'shareai-reports',
};

// Initialize local storage if empty
export function initializeLocalStorage() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.PROPERTIES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROPERTIES, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify([]));
  }
}
