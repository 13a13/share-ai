
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImagePreviewProps {
  imageUrl: string;
  isProcessing: boolean;
  onCancel: () => void;
  onProcess: () => void;
}

const ImagePreview = ({ imageUrl, isProcessing, onCancel, onProcess }: ImagePreviewProps) => {
  return (
    <div className="space-y-4">
      <div className="relative rounded-md overflow-hidden border">
        <img 
          src={imageUrl} 
          alt="Room" 
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-blue-500">
            Compressed
          </Badge>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 sm:flex-none"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button 
          onClick={onProcess}
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
              Process with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ImagePreview;
