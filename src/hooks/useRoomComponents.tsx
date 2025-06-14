
import { RoomComponent } from "@/types";
import { ROOM_COMPONENT_CONFIGS } from "@/utils/roomComponentUtils";
import { useComponentState } from "./useComponentState";
import { useComponentOperations } from "./useComponentOperations";
import { useComponentImageHandling } from "./useComponentImageHandling";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseRoomComponentsProps {
  roomId: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

interface ComponentConfig {
  name: string;
  type: string;
  isOptional?: boolean;
}

interface UseRoomComponentsReturn {
  components: RoomComponent[];
  isProcessing: { [key: string]: boolean };
  expandedComponents: string[];
  selectedComponentType: string;
  availableComponents: ComponentConfig[];
  propertyName?: string;
  roomName?: string;
  setSelectedComponentType: React.Dispatch<React.SetStateAction<string>>;
  handleAddComponent: () => void;
  addCustomComponent: (name: string) => void;
  handleRemoveComponent: (componentId: string) => void;
  handleUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void;
  toggleEditMode: (componentId: string) => void;
  handleRemoveImage: (componentId: string, imageId: string) => void;
  handleImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  handleComponentProcessingState: (componentId: string, isProcessing: boolean) => void;
  toggleExpandComponent: (componentId: string) => void;
}

export function useRoomComponents({
  roomId,
  roomType,
  propertyName: initialPropertyName,
  roomName: initialRoomName,
  initialComponents,
  onChange
}: UseRoomComponentsProps): UseRoomComponentsReturn {
  const [propertyName, setPropertyName] = useState(initialPropertyName ?? "");
  const [roomName, setRoomName] = useState(initialRoomName ?? "");

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
  }, [roomId, propertyName, roomName]);

  // Get available components for the room type
  const availableComponents = ROOM_COMPONENT_CONFIGS[roomType as keyof typeof ROOM_COMPONENT_CONFIGS] || [];

  // Component state management
  const {
    components,
    updateComponents,
    isProcessing,
    expandedComponents,
    setExpandedComponents,
    selectedComponentType,
    setSelectedComponentType,
    handleComponentProcessingState,
    toggleExpandComponent
  } = useComponentState({
    initialComponents,
    onChange
  });

  // Component CRUD operations
  const {
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode
  } = useComponentOperations({
    components,
    updateComponents,
    expandedComponents,
    setExpandedComponents,
    availableComponents,
    selectedComponentType,
    setSelectedComponentType
  });

  // Image handling operations: pass roomId for context
  const {
    handleRemoveImage,
    handleImagesProcessed
  } = useComponentImageHandling({
    components,
    updateComponents,
    expandedComponents,
    setExpandedComponents,
    onChange,
    propertyName,
    roomName,
    roomId
  });

  return {
    components,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
    propertyName,
    roomName,
    setSelectedComponentType,
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode,
    handleRemoveImage,
    handleImagesProcessed,
    handleComponentProcessingState,
    toggleExpandComponent
  };
}
