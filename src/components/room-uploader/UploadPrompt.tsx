
import { Card } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface UploadPromptProps {
  isUploading: boolean;
  onUploadClick: () => void;
  onCameraClick: () => void;
}

const UploadPrompt = ({ isUploading, onUploadClick, onCameraClick }: UploadPromptProps) => {
  const isMobile = useIsMobile();
  
  return (
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
              onClick={onCameraClick}
              className="bg-shareai-teal hover:bg-shareai-teal/90 w-full sm:w-auto"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isMobile ? "Take Photo" : "Use Camera"}
            </Button>
            <Button 
              onClick={onUploadClick}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Upload Image
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UploadPrompt;
