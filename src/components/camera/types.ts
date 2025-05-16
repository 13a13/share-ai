
/**
 * Camera component shared types and constants
 */

/**
 * Props for the CameraModal component
 */
export interface CameraModalProps {
  /**
   * Whether the camera modal is open
   */
  open: boolean;
  
  /**
   * Function called when the camera modal is closed without capturing photos
   */
  onClose: () => void;
  
  /**
   * Function called when photos are captured and confirmed
   * @param photos Array of data URLs of captured photos
   */
  onPhotosCapture: (photos: string[]) => void;
  
  /**
   * Maximum number of photos that can be taken (default: 20)
   */
  maxPhotos?: number;
  
  /**
   * Title to show in the camera header
   */
  title?: string;
}

/**
 * Props for the Camera View component
 */
export interface CameraViewProps {
  /**
   * Reference to the video element
   */
  videoRef: React.RefObject<HTMLVideoElement>;
  
  /**
   * Whether the camera is ready to capture photos
   */
  isReady: boolean;
  
  /**
   * Whether the camera is processing (initializing)
   */
  isProcessing: boolean;
  
  /**
   * Error message to display if camera initialization failed
   */
  errorMessage: string | null;
  
  /**
   * Browser permission state for camera access
   */
  permissionState: 'prompt' | 'granted' | 'denied';
  
  /**
   * Function to start the camera
   */
  onStartCamera: () => void;
}

/**
 * Props for the Shutter component
 */
export interface ShutterProps {
  /**
   * Function called when the shutter button is pressed
   */
  onCapture: () => void;
  
  /**
   * Whether the camera is currently capturing a photo
   */
  isCapturing: boolean;
  
  /**
   * Whether the shutter is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether to display the shutter as an overlay
   */
  overlay?: boolean;
}

/**
 * Props for the thumbnail strip component
 */
export interface ThumbnailStripProps {
  /**
   * Array of data URLs of captured photos
   */
  photos: string[];
  
  /**
   * Function called when a photo is deleted
   */
  onDelete: (index: number) => void;
}
