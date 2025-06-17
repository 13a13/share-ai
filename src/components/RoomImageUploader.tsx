
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import WhatsAppCamera from "./camera/WhatsAppCamera";
import { Upload } from "lucide-react";
import { useRoomImageUpload } from "@/hooks/useRoomImageUpload";
import UploadPrompt from "./room-uploader/UploadPrompt";
import ImagePreview from "./room-uploader/ImagePreview";
import RoomImageStaging from "./room/RoomImageStaging";

interface RoomImageUploaderProps {
  reportId: string;
  roomId: string;
  propertyName?: string;
  roomName?: string;
  onImageProcessed: (updatedRoom: any) => void;
}

const RoomImageUploader = ({ reportId, roomId, propertyName, roomName, onImageProcessed }: RoomImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stagingImages, setStagingImages] = useState<string[]>([]);
  
  const {
    isUploading,
    isProcessing,
    uploadedImage,
    handleFileUpload,
    handleCameraCapture,
    handleProcessWithAI,
    handleMultipleImagesProcess,
    resetUpload
  } = useRoomImageUpload({
    reportId,
    roomId,
    propertyName,
    roomName,
    onImageProcessed
  });
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (files.length === 1) {
        // Single file - use existing flow
        handleFileUpload(files[0]);
      } else {
        // Multiple files - convert to data URLs and stage
        const processFiles = async () => {
          const imageDataUrls: string[] = [];
          for (const file of files) {
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              const dataUrl = await new Promise<string>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
              });
              imageDataUrls.push(dataUrl);
            }
          }
          setStagingImages(imageDataUrls);
        };
        processFiles();
      }
    }
  };

  // Handle multiple photos from WhatsApp camera
  const handleMultiplePhotosCapture = (imageData: string[]) => {
    if (imageData.length === 0) return;
    
    if (imageData.length === 1) {
      // Single photo - use existing flow
      handleCameraCapture(imageData[0]);
    } else {
      // Multiple photos - stage them for review
      setStagingImages(imageData);
    }
  };

  const handleRemoveStagingImage = (index: number) => {
    setStagingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReorderStagingImage = (fromIndex: number, toIndex: number) => {
    setStagingImages(prev => {
      const newImages = [...prev];
      const movedImage = newImages.splice(fromIndex, 1)[0];
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const handleProcessStagingImages = async () => {
    if (stagingImages.length > 0) {
      await handleMultipleImagesProcess(stagingImages);
      setStagingImages([]);
    }
  };

  const handleCancelStaging = () => {
    setStagingImages([]);
  };
  
  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      
      {cameraOpen && (
        <WhatsAppCamera 
          onClose={() => setCameraOpen(false)}
          onPhotosCapture={handleMultiplePhotosCapture}
          maxPhotos={10} // Allow up to 10 room photos
        />
      )}
      
      {/* Show staging area if we have multiple images */}
      {stagingImages.length > 0 ? (
        <RoomImageStaging
          stagingImages={stagingImages}
          isProcessing={isProcessing}
          onRemoveImage={handleRemoveStagingImage}
          onReorderImage={handleReorderStagingImage}
          onProcessImages={handleProcessStagingImages}
          onCancel={handleCancelStaging}
        />
      ) : !uploadedImage ? (
        <UploadPrompt
          isUploading={isUploading}
          onUploadClick={handleUploadClick}
          onCameraClick={() => setCameraOpen(true)}
        />
      ) : (
        <ImagePreview
          imageUrl={uploadedImage}
          isProcessing={isProcessing}
          onCancel={resetUpload}
          onProcess={handleProcessWithAI}
        />
      )}
    </div>
  );
};

export default RoomImageUploader;
