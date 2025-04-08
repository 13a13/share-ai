
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI, GeminiAPI } from "@/lib/api";
import { Room } from "@/types";
import { Camera, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

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
        setUploadedImage(imageUrl);
        
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
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "There was a problem processing your image with AI",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
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
      
      {!uploadedImage ? (
        <Card 
          className="border-dashed border-2 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleUploadClick}
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-shareai-teal animate-spin mb-2" />
          ) : (
            <Camera className="h-10 w-10 text-shareai-teal mb-2" />
          )}
          <p className="text-center font-medium mb-1">
            {isUploading ? "Uploading..." : "Upload Room Photo"}
          </p>
          <p className="text-sm text-gray-500 text-center">
            Click to select an image or drag and drop
          </p>
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
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProcessImage}
              disabled={isProcessing}
              className="bg-shareai-teal hover:bg-shareai-teal/90"
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
