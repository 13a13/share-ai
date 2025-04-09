
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import CameraCapture from "./CameraCapture";
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

  const handleCaptureComplete = (imageData: string) => {
    setCameraOpen(false);
    handleCameraCapture(imageData);
  };
  
  if (cameraOpen) {
    return (
      <CameraCapture 
        onCapture={handleCaptureComplete} 
        onCancel={() => setCameraOpen(false)} 
        isProcessing={isUploading}
      />
    );
  }
  
  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
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
