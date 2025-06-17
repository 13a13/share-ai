
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
  maxPhotos = 20,
  title = "Camera"
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };
  
  const handlePhotosCapture = (photos: string[]) => {
    onPhotosCapture(photos);
    setIsOpen(false);
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
