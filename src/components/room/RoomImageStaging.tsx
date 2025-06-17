
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

interface RoomImageStagingProps {
  stagingImages: string[];
  isProcessing: boolean;
  onRemoveImage: (index: number) => void;
  onReorderImage: (fromIndex: number, toIndex: number) => void;
  onProcessImages: () => void;
  onCancel: () => void;
}

const RoomImageStaging: React.FC<RoomImageStagingProps> = ({
  stagingImages,
  isProcessing,
  onRemoveImage,
  onReorderImage,
  onProcessImages,
  onCancel
}) => {
  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < stagingImages.length) {
      onReorderImage(index, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Room Photos Ready for Processing</h3>
          <p className="text-sm text-gray-600">
            {stagingImages.length} photo{stagingImages.length !== 1 ? 's' : ''} captured
          </p>
        </div>
        <Badge variant="secondary">{stagingImages.length} photos</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {stagingImages.map((image, index) => (
          <Card key={index} className="relative group overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={image}
                alt={`Room photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Remove button */}
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveImage(index)}
                disabled={isProcessing}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Reorder buttons */}
              <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={() => moveImage(index, 'left')}
                  disabled={index === 0 || isProcessing}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs bg-black/50 text-white px-1 rounded self-center">
                  {index + 1}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={() => moveImage(index, 'right')}
                  disabled={index === stagingImages.length - 1 || isProcessing}
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <ProgressIndicator
            variant="progress"
            text="Processing room photos with AI..."
            showPercentage={false}
          />
          <p className="text-sm text-gray-600 text-center">
            Analyzing {stagingImages.length} photo{stagingImages.length !== 1 ? 's' : ''} to understand the room condition...
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          onClick={onProcessImages}
          disabled={isProcessing || stagingImages.length === 0}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          {isProcessing ? (
            <>
              <ProgressIndicator variant="inline" size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            `Process ${stagingImages.length} Photo${stagingImages.length !== 1 ? 's' : ''} with AI`
          )}
        </Button>
      </div>
    </div>
  );
};

export default RoomImageStaging;
