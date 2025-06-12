
import { RoomComponent } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useComponentImageProcessing } from "./useComponentImageProcessing";

interface UseComponentImageHandlingProps {
  components: RoomComponent[];
  updateComponents: (updatedComponents: RoomComponent[]) => void;
  expandedComponents: string[];
  setExpandedComponents: (components: string[]) => void;
  onChange: (updatedComponents: RoomComponent[]) => void;
  propertyName?: string;
  roomName?: string;
}

export function useComponentImageHandling({
  components,
  updateComponents,
  expandedComponents,
  setExpandedComponents,
  onChange,
  propertyName,
  roomName
}: UseComponentImageHandlingProps) {
  const { toast } = useToast();

  // Use the image processing hook
  const { handleImagesProcessed } = useComponentImageProcessing({
    components,
    expandedComponents,
    setComponents: updateComponents,
    setExpandedComponents,
    onChange
  });

  const handleRemoveImage = (componentId: string, imageId: string) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          images: comp.images.filter(img => img.id !== imageId)
        };
      }
      return comp;
    });
    updateComponents(updatedComponents);

    toast({
      title: "Image Removed",
      description: "The image has been removed from the component.",
    });
  };

  // Modified handleImagesProcessed to include property and room names
  const handleImagesProcessedWithContext = (componentId: string, imageUrls: string[], result: any) => {
    console.log(`🖼️ Images processed for component ${componentId} in property: ${propertyName}, room: ${roomName}`);
    handleImagesProcessed(componentId, imageUrls, result);
  };

  return {
    handleRemoveImage,
    handleImagesProcessed: handleImagesProcessedWithContext
  };
}
