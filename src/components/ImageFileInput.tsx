
import React, { useState } from "react";
import { Camera, Upload } from "lucide-react";
import LoadingSpinner from "./ui/LoadingSpinner";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import CameraCapture from "./CameraCapture";

interface ImageFileInputProps {
  id: string;
  isProcessing: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageCapture?: (imageData: string) => void;
  label?: string;
  processingLabel?: string;
}

const ImageFileInput = ({ 
  id, 
  isProcessing, 
  onChange, 
  onImageCapture,
  label = "Upload Photo", 
  processingLabel = "Processing..." 
}: ImageFileInputProps) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleCameraCapture = (imageData: string) => {
    setCameraOpen(false);
    if (onImageCapture) {
      onImageCapture(imageData);
    }
  };

  if (cameraOpen) {
    return (
      <CameraCapture 
        onCapture={handleCameraCapture} 
        onCancel={() => setCameraOpen(false)} 
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* File Upload Button */}
      <div className="relative">
        <input
          type="file" 
          id={id} 
          accept="image/*"
          className="sr-only"
          onChange={onChange}
          disabled={isProcessing}
        />
        <label 
          htmlFor={id}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-shareai-teal hover:bg-shareai-teal/90 cursor-pointer"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" text={processingLabel} />
            </div>
          ) : (
            <div className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              {label}
            </div>
          )}
        </label>
      </div>

      {/* Camera Button - Only show if onImageCapture is provided */}
      {onImageCapture && (
        <Button
          onClick={() => setCameraOpen(true)}
          variant="outline"
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          {isMobile ? "Take Photo" : "Use Camera"}
        </Button>
      )}
    </div>
  );
};

export default ImageFileInput;
