
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, ImagePlus } from "lucide-react";

interface ImageFileInputProps {
  id: string;
  isProcessing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageCapture: (imageData: string) => void;
  multiple?: boolean;
}

const ImageFileInput = ({ 
  id, 
  isProcessing, 
  onChange, 
  onImageCapture,
  multiple = false
}: ImageFileInputProps) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Start camera capture
  const startCamera = async () => {
    setIsCameraOpen(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCameraOpen(false);
    }
  };
  
  // Stop camera capture
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOpen(false);
  };
  
  // Take a picture
  const takePicture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onImageCapture(imageData);
        stopCamera();
      }
    }
  };
  
  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  
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
      />
      
      {isCameraOpen ? (
        <div className="space-y-2">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            className="w-full h-auto max-h-96 bg-black rounded"
          ></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
            <Button onClick={takePicture} className="bg-shareai-teal hover:bg-shareai-teal/90">
              Take Photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={startCamera}
            disabled={isProcessing}
            variant="outline"
            className="flex-1 flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Take Photo
          </Button>
          <Button
            onClick={openFilePicker}
            disabled={isProcessing}
            variant="outline"
            className="flex-1 flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              multiple ? (
                <ImagePlus className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )
            )}
            {multiple ? 'Upload Images' : 'Upload Image'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageFileInput;
