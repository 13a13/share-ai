
import React, { useState } from "react";
import CameraModal from "./CameraModal";

interface WhatsAppCameraProps {
  /**
   * Function called when the camera is closed without capturing photos
   */
  onClose: () => void;
  
  /**
   * Function called when photos are captured and confirmed
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
 * A WhatsApp-style camera component that allows taking multiple photos
 */
const WhatsAppCamera: React.FC<WhatsAppCameraProps> = ({
  onClose,
  onPhotosCapture,
  maxPhotos = 1,
  title = "Camera"
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };
  
  const handlePhotosCapture = (photos: string[]) => {
    try {
      if (photos && Array.isArray(photos) && photos.length > 0) {
        onPhotosCapture(photos);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling photos capture:", error);
      // Still close the camera even if there's an error
      setIsOpen(false);
      onClose();
    }
  };
  
  return (
    <CameraModal
      open={isOpen}
      onClose={handleClose}
      onPhotosCapture={handlePhotosCapture}
      maxPhotos={maxPhotos}
      title={title}
    />
  );
};

export default WhatsAppCamera;
