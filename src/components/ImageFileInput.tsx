
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ImagePlus } from "lucide-react";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import WhatsAppCamera from "./camera/WhatsAppCamera";
import { debugImageFlow } from "@/utils/debugImageFlow";

interface ImageFileInputProps {
  id: string;
  isProcessing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // UPDATED: Support both signatures with overload
  onImageCapture: ((imageData: string) => void) | ((imageData: string[]) => void);
  multiple?: boolean;
  disabled?: boolean;
  totalImages?: number;
  maxImages?: number;
  compressionInProgress?: boolean;
  // NEW: Explicit flag to control behavior
  supportMultipleCapture?: boolean;
}

const ImageFileInput = ({ 
  id, 
  isProcessing, 
  onChange, 
  onImageCapture,
  multiple = false,
  disabled = false,
  totalImages = 0,
  maxImages = 20,
  compressionInProgress = false,
  supportMultipleCapture = false  // NEW: Default to false for backward compatibility
}: ImageFileInputProps) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  
  // ENHANCED: Handle photos from WhatsApp camera with normalization
  const handleWhatsAppCameraPhotos = (photos: string[]) => {
    debugImageFlow.logCapture('ImageFileInput.handleWhatsAppCameraPhotos', photos, {
      supportMultipleCapture,
      photosLength: photos.length
    });

    if (photos.length === 0) return;
    
    // ENHANCED: Check function signature and multiple support
    if (supportMultipleCapture) {
      // Pass all photos when multiple capture is supported
      (onImageCapture as (data: string[]) => void)(photos);
    } else {
      // Backward compatibility: pass only first photo
      (onImageCapture as (data: string) => void)(photos[0]);
      
      // Warn about lost images in development
      if (photos.length > 1 && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ ImageFileInput: ${photos.length - 1} additional photos were discarded. Enable supportMultipleCapture=true to handle multiple photos.`);
      }
    }
  };
  
  const remainingImages = maxImages - totalImages;
  const hasReachedLimit = remainingImages <= 0;
  const cameraMaxPhotos = supportMultipleCapture 
    ? Math.min(remainingImages, 10) 
    : 1; // Only allow 1 photo if multiple capture not supported
  
  return (
    <div>
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={onChange}
        className="hidden"
        disabled={disabled || hasReachedLimit}
      />
      
      {/* WhatsApp-style camera modal */}
      {isCameraOpen && (
        <WhatsAppCamera
          onClose={() => setIsCameraOpen(false)}
          onPhotosCapture={handleWhatsAppCameraPhotos}
          maxPhotos={cameraMaxPhotos} // Use calculated max photos
        />
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => setIsCameraOpen(true)}
          disabled={isProcessing || disabled || hasReachedLimit}
          variant="outline"
          className="flex-1 flex items-center gap-2"
        >
          {isProcessing ? (
            <ProgressIndicator variant="inline" size="sm" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {compressionInProgress ? "Compressing..." : "Take Photos"}
        </Button>
        
        <Button
          onClick={openFilePicker}
          disabled={isProcessing || disabled || hasReachedLimit}
          variant="outline"
          className="flex-1 flex items-center gap-2"
        >
          {isProcessing ? (
            <ProgressIndicator variant="inline" size="sm" />
          ) : (
            multiple ? (
              <ImagePlus className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )
          )}
          {compressionInProgress ? "Compressing..." : (multiple ? 'Upload Images' : 'Upload Image')}
        </Button>
      </div>
      
      {hasReachedLimit && (
        <div className="text-amber-600 text-xs mt-2">
          Maximum of {maxImages} images reached. Remove some to add more.
        </div>
      )}
    </div>
  );
};

export default ImageFileInput;
