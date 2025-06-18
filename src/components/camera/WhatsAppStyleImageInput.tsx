
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ImagePlus } from "lucide-react";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import WhatsAppCamera from "./WhatsAppCamera";
import { debugImageFlow } from "@/utils/debugImageFlow";

interface WhatsAppStyleImageInputProps {
  id: string;
  isProcessing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageCapture: (imagesData: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  totalImages?: number;
  maxImages?: number;
  compressionInProgress?: boolean;
  supportMultipleCapture?: boolean;
}

const WhatsAppStyleImageInput = ({
  id,
  isProcessing,
  onChange,
  onImageCapture,
  multiple = true,
  disabled = false,
  totalImages = 0,
  maxImages = 20,
  compressionInProgress = false,
  supportMultipleCapture = true // Default to true for WhatsApp-style
}: WhatsAppStyleImageInputProps) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Handle photos captured from WhatsApp-style camera
  const handlePhotosCaptured = (photos: string[]) => {
    debugImageFlow.logCapture('WhatsAppStyleImageInput.handlePhotosCaptured', photos, {
      supportMultipleCapture,
      photosLength: photos.length
    });

    // Pass all captured photos to parent
    onImageCapture(photos);
    setIsCameraOpen(false);
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
          onPhotosCapture={handlePhotosCaptured}
          maxPhotos={cameraMaxPhotos} // Use calculated max photos
        />
      )}

      {/* Button controls */}
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

export default WhatsAppStyleImageInput;
