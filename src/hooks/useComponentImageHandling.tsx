import { RoomComponent } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useComponentImageProcessing } from "./useComponentImageProcessing";
import { useState, useEffect } from "react";

interface UseComponentImageHandlingProps {
  components: RoomComponent[];
  updateComponents: (updatedComponents: RoomComponent[]) => void;
  expandedComponents: string[];
  setExpandedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  onChange: (updatedComponents: RoomComponent[]) => void;
  propertyName?: string;
  roomName?: string;
}

interface UseComponentImageHandlingReturn {
  handleRemoveImage: (componentId: string, imageId: string) => void;
  handleImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
}

export function useComponentImageHandling({
  components,
  updateComponents,
  expandedComponents,
  setExpandedComponents,
  onChange,
  propertyName: propName,
  roomName: rmName
}: UseComponentImageHandlingProps): UseComponentImageHandlingReturn {
  const { toast } = useToast();

  // Ensure actual property and room names (to pass to image handling hooks)
  const [propertyName, setPropertyName] = useState(propName ?? "");
  const [roomName, setRoomName] = useState(rmName ?? "");

  useEffect(() => {
    async function fetchNamesIfNeeded() {
      if ((!propertyName || propertyName === "unknown_property" || propertyName.trim() === "") && window.supabase) {
        const componentWithRoomId = components[0];
        if (componentWithRoomId && (componentWithRoomId.roomId || componentWithRoomId.id)) {
          const roomIdToFetch = componentWithRoomId.roomId || componentWithRoomId.id;
          try {
            const { data, error } = await window.supabase
              .from('rooms')
              .select('id, name, property_id, properties(name)')
              .eq('id', roomIdToFetch)
              .maybeSingle();
            if (data) {
              setRoomName(data.name ?? "");
              setPropertyName(data.properties?.name ?? "");
            }
          } catch (err) {}
        }
      }
    }
    fetchNamesIfNeeded();
  }, [propertyName, roomName, components]);

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
