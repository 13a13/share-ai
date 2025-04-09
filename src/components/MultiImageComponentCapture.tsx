
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ConditionRating } from "@/types";
import ImageFileInput from "./ImageFileInput";
import { processComponentImage, ProcessedImageResult } from "@/services/imageProcessingService";
import { Button } from "./ui/button";
import { Camera, Image, Trash2, GripVertical, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MultiImageComponentCaptureProps {
  componentId: string;
  componentName: string;
  roomType: string;
  isProcessing: boolean;
  currentImages: { id: string, url: string, timestamp: Date }[];
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onRemoveImage: (index: number) => void;
}

// Draggable Image Item Type
const ItemType = "IMAGE";

// Draggable Image Component
const DraggableImage = ({ image, index, onRemove, onMove }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: ItemType,
    hover: (item, monitor) => {
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex; // Update the dragged item's index
    }
  });

  return (
    <div 
      ref={(node) => dragRef(dropRef(node))}
      className={cn(
        "relative group border rounded overflow-hidden cursor-move", 
        isDragging ? "opacity-50 border-dashed border-2 border-gray-400" : ""
      )}
    >
      <img 
        src={image.url} 
        alt={`Image ${index + 1}`} 
        className="w-full h-24 object-cover"
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <div className="absolute top-1 left-1 opacity-50 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
      </div>
    </div>
  );
};

const MultiImageComponentCapture = ({ 
  componentId, 
  componentName,
  roomType, 
  isProcessing,
  currentImages,
  onImagesProcessed,
  onProcessingStateChange,
  onRemoveImage
}: MultiImageComponentCaptureProps) => {
  const { toast } = useToast();
  const [stagingImages, setStagingImages] = useState<string[]>([]);
  const [analysisInProgress, setAnalysisInProgress] = useState(false);

  const processImages = async () => {
    if (stagingImages.length === 0) return;
    
    onProcessingStateChange(componentId, true);
    setAnalysisInProgress(true);
    
    try {
      // Process all images together with the component name
      const result = await processComponentImage(stagingImages, roomType, componentName, true);
      onImagesProcessed(componentId, stagingImages, result);
      
      toast({
        title: "Images processed successfully",
        description: `AI has analyzed ${stagingImages.length} ${stagingImages.length === 1 ? 'image' : 'images'} for ${componentName}`,
      });
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Error processing images",
        description: "AI analysis failed. Please try again or check your internet connection.",
        variant: "destructive",
      });
      
      // Even if AI fails, still add the images without AI data
      onImagesProcessed(componentId, stagingImages, {
        description: "",
        condition: {
          summary: "",
          points: [],
          rating: "fair"
        },
        cleanliness: "domestic_clean",
        notes: "AI analysis failed - please add description manually"
      });
    } finally {
      setStagingImages([]);
      onProcessingStateChange(componentId, false);
      setAnalysisInProgress(false);
    }
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Handle multiple file selection
    const newImages: string[] = [];
    const maxFilesToAdd = 20 - (stagingImages.length + currentImages.length);
    
    if (maxFilesToAdd <= 0) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 20 images per component.",
        variant: "destructive",
      });
      return;
    }
    
    // Process up to maxFilesToAdd images
    const filesToProcess = Array.from(event.target.files).slice(0, maxFilesToAdd);
    
    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue;
      
      // Create a data URL for the image
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    if (newImages.length > 0) {
      setStagingImages([...stagingImages, ...newImages]);
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    if (stagingImages.length + currentImages.length >= 20) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 20 images per component.",
        variant: "destructive",
      });
      return;
    }
    
    setStagingImages([...stagingImages, imageData]);
  };

  const handleRemoveStagingImage = (index: number) => {
    setStagingImages(stagingImages.filter((_, i) => i !== index));
  };
  
  const moveImage = (dragIndex: number, hoverIndex: number) => {
    const draggedImage = stagingImages[dragIndex];
    const newImages = [...stagingImages];
    newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, draggedImage);
    setStagingImages(newImages);
  };

  const totalImages = currentImages.length + stagingImages.length;
  const canAddMore = totalImages < 20;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        {stagingImages.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Preview Images ({stagingImages.length})</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {stagingImages.map((image, index) => (
                <DraggableImage
                  key={index}
                  image={{ url: image }}
                  index={index}
                  onRemove={handleRemoveStagingImage}
                  onMove={moveImage}
                />
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setStagingImages([])}
                disabled={analysisInProgress}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={processImages}
                disabled={analysisInProgress || stagingImages.length === 0}
              >
                {analysisInProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Analyze Images"
                )}
              </Button>
            </div>
          </div>
        )}
        
        {canAddMore && (
          <div className="flex flex-wrap gap-2">
            <ImageFileInput
              id={`image-upload-${componentId}`}
              isProcessing={isProcessing}
              onChange={handleImageCapture}
              onImageCapture={handleCameraCapture}
              multiple={true} // Enable multiple file selection
            />
            <div className="text-sm text-gray-500 mt-1">
              {totalImages}/20 images
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default MultiImageComponentCapture;
