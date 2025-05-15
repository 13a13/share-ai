
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ImagePlus } from "lucide-react";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

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
  const [isCaptureSeries, setIsCaptureSeries] = useState(false);
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
    setIsCaptureSeries(false);
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
        
        // If in capture series mode and not reached the max, stay in camera mode
        if (isCaptureSeries && totalImages < maxImages - 1) {
          return;
        }
        
        stopCamera();
      }
    }
  };
  
  // Start multi-photo capture series
  const startCaptureSeries = async () => {
    setIsCaptureSeries(true);
    await startCamera();
  };
  
  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  
  const remainingImages = maxImages - totalImages;
  const hasReachedLimit = remainingImages <= 0;
  
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
      
      {isCameraOpen ? (
        <div className="space-y-2">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            className="w-full h-auto max-h-96 bg-black rounded"
          ></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          
          <div className="flex justify-between items-center">
            {isCaptureSeries && (
              <div className="text-sm">
                {remainingImages} {remainingImages === 1 ? 'photo' : 'photos'} remaining
              </div>
            )}
            <div className="flex ml-auto space-x-2">
              <Button variant="outline" onClick={stopCamera} size="sm">
                Done
              </Button>
              <Button 
                onClick={takePicture} 
                className="bg-shareai-teal hover:bg-shareai-teal/90" 
                size="sm"
                disabled={compressionInProgress}
              >
                {compressionInProgress ? (
                  <>
                    <ProgressIndicator variant="inline" size="sm" />
                    <span className="ml-2">Compressing...</span>
                  </>
                ) : (
                  isCaptureSeries ? "Take Photo" : "Capture"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={startCaptureSeries}
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
      )}
      
      {hasReachedLimit && (
        <div className="text-amber-600 text-xs mt-2">
          Maximum of {maxImages} images reached. Remove some to add more.
        </div>
      )}
    </div>
  );
};

export default ImageFileInput;
