
import React, { useState, useEffect } from "react";
import CameraContainer from "./CameraContainer";
import CameraModalWrapper from "./CameraModalWrapper";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onPhotosCapture: (photos: string[]) => void;
  maxPhotos?: number;
  title?: string;
}

const CameraModal: React.FC<CameraModalProps> = ({
  open,
  onClose,
  onPhotosCapture,
  maxPhotos = 20,
  title = "Camera"
}) => {
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Any cleanup if needed
    }
  }, [open]);

  return (
    <CameraModalWrapper open={open} onClose={onClose}>
      <CameraContainer
        onClose={onClose}
        onPhotosCapture={onPhotosCapture}
        maxPhotos={maxPhotos}
        title={title}
      />
    </CameraModalWrapper>
  );
};

export default CameraModal;
