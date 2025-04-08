
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI, GeminiAPI } from "@/lib/api";
import { Room } from "@/types";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import CameraCapture from "./CameraCapture";
import { useIsMobile } from "@/hooks/use-mobile";

interface RoomImageUploaderProps {
  reportId: string;
  roomId: string;
  onImageProcessed: (updatedRoom: Room) => void;
}

const RoomImageUploader = ({ reportId, roomId, onImageProcessed }: RoomImageUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // In a real app, we would upload to a server or cloud storage
      // For this demo, we'll create a data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageUrl = event.target?.result as string;
        processImage(imageUrl);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setCameraOpen(false);
    processImage(imageData);
  };
  
  const processImage = async (imageUrl: string) => {
    setIsUploading(true);
    setUploadedImage(imageUrl);
    
    try {
      // Add the image to the room
      const image = await ReportsAPI.addImageToRoom(reportId, roomId, imageUrl);
      
      if (image) {
        setUploadedImageId(image.id);
        toast({
          title: "Image uploaded",
          description: "Image has been added to the room",
        });
      }
      
      setIsUploading(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  const handleProcessImage = async () => {
    if (!uploadedImageId) return;
    
    setIsProcessing(true);
    
    try {
      // Process the image with Gemini AI
      const updatedRoom = await GeminiAPI.processRoomImage(reportId, roomId, uploadedImageId);
      
      if (updatedRoom) {
        toast({
          title: "Image processed",
          description: "AI has analyzed the image and updated the room details",
        });
        
        // Reset the uploader
        setUploadedImage(null);
        setUploadedImageId(null);
        
        // Notify parent component
        onImageProcessed(updatedRoom);
      } else {
        toast({
          title: "Processing failed",
          description: "AI analysis was unable to process this image. You can still edit room details manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing failed",
        description: "There was a problem processing your image with AI. You can still edit room details manually.",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };

  if (cameraOpen) {
    return (
      <CameraCapture 
        onCapture={handleCameraCapture} 
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
        <Card 
          className="border-dashed border-2 p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-shareai-teal animate-spin mb-2" />
          ) : (
            <div className="w-full">
              <div className="flex flex-col items-center justify-center p-4">
                <Camera className="h-10 w-10 text-shareai-teal mb-2" />
                <p className="text-center font-medium mb-1">Add Room Photo</p>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Take a photo or upload from your device
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  onClick={() => setCameraOpen(true)}
                  className="bg-shareai-teal hover:bg-shareai-teal/90 w-full sm:w-auto"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isMobile ? "Take Photo" : "Use Camera"}
                </Button>
                <Button 
                  onClick={handleUploadClick}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-md overflow-hidden border">
            <img 
              src={uploadedImage} 
              alt="Room" 
              className="w-full h-64 object-cover"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadedImage(null);
                setUploadedImageId(null);
              }}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleProcessImage}
              disabled={isProcessing}
              className="bg-shareai-teal hover:bg-shareai-teal/90 flex-1 sm:flex-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Process with AI
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomImageUploader;
