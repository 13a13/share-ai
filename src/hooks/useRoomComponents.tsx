
import { useState, useEffect } from "react";
import { RoomType, RoomComponent } from "@/types";
import { useComponentSelection } from "./useComponentSelection";
import { useComponentAddition } from "./useComponentAddition";
import { useComponentExpansion } from "./useComponentExpansion";
import { useComponentActions } from "./useComponentActions";
import { useComponentImageHandling } from "./useComponentImageHandling";

interface UseRoomComponentsProps {
  roomId: string;
  roomType: RoomType;
  propertyName?: string;
  roomName?: string;
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

export const useRoomComponents = ({
  roomId,
  roomType,
  propertyName,
  roomName,
  initialComponents,
  onChange
}: UseRoomComponentsProps) => {
  const [components, setComponents] = useState<RoomComponent[]>(initialComponents);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  console.log(`🏗️ useRoomComponents for room "${roomName}" in property "${propertyName}" with ${components.length} components`);

  // Update components when initialComponents change
  useEffect(() => {
    setComponents(initialComponents);
  }, [initialComponents]);

  // Component selection logic
  const {
    selectedComponentType,
    availableComponents,
    setSelectedComponentType
  } = useComponentSelection({ roomType });

  // Component addition logic
  const {
    handleAddComponent,
    addCustomComponent
  } = useComponentAddition({
    selectedComponentType,
    roomId,
    components,
    setComponents,
    onChange
  });

  // Component expansion logic
  const {
    expandedComponents,
    setExpandedComponents,
    toggleExpandComponent
  } = useComponentExpansion();

  // Component actions (edit, remove, update)
  const {
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode
  } = useComponentActions({
    components,
    setComponents,
    onChange
  });

  // Component image handling with property and room names
  const {
    handleRemoveImage,
    handleImagesProcessed
  } = useComponentImageHandling({
    components,
    updateComponents: setComponents,
    expandedComponents,
    setExpandedComponents,
    onChange,
    propertyName,
    roomName
  });

  // Handle component processing state
  const handleComponentProcessingState = (componentId: string, processing: boolean) => {
    setIsProcessing(prev => ({
      ...prev,
      [componentId]: processing
    }));
  };

  // Update parent component when components change
  useEffect(() => {
    onChange(components);
  }, [components, onChange]);

  return {
    components,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
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
};
