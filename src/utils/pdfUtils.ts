
/**
 * Utility functions for PDF generation and handling
 */

/**
 * Detects if the current device is running iOS
 * @returns boolean indicating if the device is iOS
 */
export const isIosDevice = (): boolean => {
  // Using navigator.userAgent to detect iOS devices
  // MSStream check is important to exclude IE11 which may have iPad in user agent
  // Need to handle the TypeScript error by using type assertion
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Converts a base64 data URI to a Blob object
 * @param dataUri The base64 data URI to convert
 * @returns Blob object created from the data URI
 */
export const dataUriToBlob = (dataUri: string): Blob => {
  // Extract the base64 data from the URI
  const byteString = dataUri.includes('base64,') 
    ? atob(dataUri.split('base64,')[1]) 
    : decodeURIComponent(dataUri.split(',')[1]);
  
  // Create an array buffer from the binary string
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  // Create a Blob with the array buffer
  return new Blob([arrayBuffer], { type: 'application/pdf' });
};

/**
 * Creates a Blob URL from a base64 data URI
 * @param dataUri The base64 data URI to convert
 * @returns Blob URL created from the data URI
 */
export const createBlobUrl = (dataUri: string): string => {
  try {
    const blob = dataUriToBlob(dataUri);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating blob URL from data URI:', error);
    return dataUri; // Fallback to original dataUri if conversion fails
  }
};

/**
 * Revokes a Blob URL to free up memory
 * @param blobUrl The Blob URL to revoke
 */
export const revokeBlobUrl = (blobUrl: string): void => {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);
  }
};

/**
 * Triggers PDF download using the most compatible method for the current browser
 * @param pdfDataUri The PDF data URI or Blob URL
 * @param fileName The name for the downloaded file
 */
export const downloadPdf = (pdfDataUri: string, fileName: string): void => {
  if (!pdfDataUri) return;
  
  try {
    // Create a blob URL if needed
    const isDataUri = pdfDataUri.startsWith('data:');
    const url = isDataUri ? createBlobUrl(pdfDataUri) : pdfDataUri;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    
    // Click the link to trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    // If we created a blob URL, revoke it after a short delay
    if (isDataUri && url !== pdfDataUri) {
      setTimeout(() => revokeBlobUrl(url), 100);
    }
  } catch (error) {
    console.error('Error processing PDF for download:', error);
    
    // Fallback for iOS - open in new tab
    if (isIosDevice()) {
      window.open(pdfDataUri, '_blank');
    }
  }
};
