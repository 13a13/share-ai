
import { RoomComponent } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useComponentImageProcessing } from "./useComponentImageProcessing";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseComponentImageHandlingProps {
  components: RoomComponent[];
  updateComponents: (updatedComponents: RoomComponent[]) => void;
  expandedComponents: string[];
  setExpandedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  onChange: (updatedComponents: RoomComponent[]) => void;
  propertyName?: string;
  roomName?: string;
  // Pass roomId to allow resolving missing names:
  roomId?: string;
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
  roomName: rmName,
  roomId
}: UseComponentImageHandlingProps): UseComponentImageHandlingReturn {
  const { toast } = useToast();

  const [propertyName, setPropertyName] = useState(propName ?? "");
  const [roomName, setRoomName] = useState(rmName ?? "");

  useEffect(() => {
    async function fetchNamesIfNeeded() {
      if ((!propertyName || propertyName === "unknown_property" || propertyName.trim() === "") && roomId && supabase) {
        const { data, error } = await supabase
          .from('rooms')
          .select('id, name, property_id, properties(name)')
          .eq('id', roomId)
          .maybeSingle();
        if (data && !error) {
          setRoomName((data as any).name ?? "");
          setPropertyName((data as any).properties?.name ?? "");
        }
      }
    }
    fetchNamesIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyName, roomName, roomId]);

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

  const handleImagesProcessedWithContext = (componentId: string, imageUrls: string[], result: any) => {
    console.log(`🖼️ Images processed for component ${componentId} in property: ${propertyName}, room: ${roomName}`);
    handleImagesProcessed(componentId, imageUrls, result);
  };

  return {
    handleRemoveImage,
    handleImagesProcessed: handleImagesProcessedWithContext
  };
}
