
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ImagePlus } from "lucide-react";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import WhatsAppCamera from "./camera/WhatsAppCamera";

interface ImageFileInputProps {
  id: string;
  isProcessing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageCapture: (imageData: string) => void;
  multiple?: boolean;
  disabled?: boolean;
  totalImages?: number;
  maxImages?: number;
  compressionInProgress?: boolean;
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
  compressionInProgress = false
}: ImageFileInputProps) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  
  // Handle photos from WhatsApp camera
  const handleWhatsAppCameraPhotos = (photos: string[]) => {
    if (photos.length > 0) {
      // For backward compatibility, just use the first photo when onImageCapture expects a single image
      onImageCapture(photos[0]);
    }
  };
  
  const remainingImages = maxImages - totalImages;
  const hasReachedLimit = remainingImages <= 0;
  const cameraMaxPhotos = Math.min(remainingImages, multiple ? 10 : 5); // Allow more photos when multiple is true
  
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
