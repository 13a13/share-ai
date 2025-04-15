
import { useState } from "react";
import { RoomComponent, RoomType } from "@/types";
import { useComponentActions } from "./useComponentActions";
import { useComponentExpansion } from "./useComponentExpansion";
import { useComponentSelection } from "./useComponentSelection";
import { useComponentAddition } from "./useComponentAddition";
import { useComponentImageProcessing } from "./useComponentImageProcessing";

interface UseRoomComponentsProps {
  roomId: string;
  roomType: RoomType;
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

export function useRoomComponents({
  roomId,
  roomType,
  initialComponents,
  onChange
}: UseRoomComponentsProps) {
  // Component actions hook (update, remove, edit mode)
  const {
    components,
    isProcessing,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode,
    handleRemoveImage,
    handleComponentProcessingState,
    setComponents
  } = useComponentActions({
    initialComponents,
    onChange
  });

  // Component expansion hook (accordion state)
  const {
    expandedComponents,
    setExpandedComponents,
    toggleExpandComponent
  } = useComponentExpansion();

  // Component selection hook (dropdown)
  const {
    selectedComponentType,
    setSelectedComponentType,
    availableComponents
  } = useComponentSelection({
    roomType,
    components
  });

  // Component addition hook
  const {
    handleAddComponent,
    addCustomComponent
  } = useComponentAddition({
    roomType,
    components,
    expandedComponents,
    selectedComponentType,
    setComponents,
    setExpandedComponents,
    onChange
  });

  // Component image processing hook
  const {
    handleImagesProcessed
  } = useComponentImageProcessing({
    components,
    expandedComponents,
    setComponents,
    setExpandedComponents,
    onChange
  });

  return {
    // State
    components,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
    
    // Actions
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
