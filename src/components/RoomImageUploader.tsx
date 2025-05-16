
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import WhatsAppCamera from "./camera/WhatsAppCamera";
import { Upload } from "lucide-react";
import { useRoomImageUpload } from "@/hooks/useRoomImageUpload";
import UploadPrompt from "./room-uploader/UploadPrompt";
import ImagePreview from "./room-uploader/ImagePreview";

interface RoomImageUploaderProps {
  reportId: string;
  roomId: string;
  onImageProcessed: (updatedRoom: any) => void;
}

const RoomImageUploader = ({ reportId, roomId, onImageProcessed }: RoomImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  
  const {
    isUploading,
    isProcessing,
    uploadedImage,
    handleFileUpload,
    handleCameraCapture,
    handleProcessWithAI,
    resetUpload
  } = useRoomImageUpload({
    reportId,
    roomId,
    onImageProcessed
  });
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle multiple photos from WhatsApp camera
  const handleMultiplePhotosCapture = (imageData: string[]) => {
    if (imageData.length > 0) {
      // For now, just use the first photo
      // In a future enhancement, we could allow multiple room photos
      handleCameraCapture(imageData[0]);
    }
  };
  
  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {cameraOpen && (
        <WhatsAppCamera 
          onClose={() => setCameraOpen(false)}
          onPhotosCapture={handleMultiplePhotosCapture}
          maxPhotos={1} // For room photo, only allow 1 for now
        />
      )}
      
      {!uploadedImage ? (
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
