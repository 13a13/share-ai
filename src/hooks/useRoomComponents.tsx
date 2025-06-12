
import { RoomComponent } from "@/types";
import { ROOM_COMPONENT_CONFIGS } from "@/utils/roomComponentUtils";
import { useComponentState } from "./useComponentState";
import { useComponentOperations } from "./useComponentOperations";
import { useComponentImageHandling } from "./useComponentImageHandling";

interface UseRoomComponentsProps {
  roomId: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

export function useRoomComponents({
  roomId,
  roomType,
  propertyName,
  roomName,
  initialComponents,
  onChange
}: UseRoomComponentsProps) {
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

  // Image handling operations
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
    roomName
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
