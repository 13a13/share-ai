
import { useState, useEffect } from "react";
import { RoomType, RoomComponent } from "@/types";
import { useComponentState } from "./useComponentState";
import { useComponentSelection } from "./useComponentSelection";
import { useComponentExpansion } from "./useComponentExpansion";
import { useComponentAddition } from "./useComponentAddition";
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

export function useRoomComponents({
  roomId,
  roomType,
  propertyName,
  roomName,
  initialComponents,
  onChange
}: UseRoomComponentsProps) {
  console.log(`🔧 useRoomComponents: propertyName="${propertyName}", roomName="${roomName}"`);
  
  // Component state management - fix argument order
  const {
    components,
    isProcessing,
    updateComponents,
    setProcessingState
  } = useComponentState(initialComponents, onChange);

  // Component selection
  const {
    selectedComponentType,
    availableComponents,
    setSelectedComponentType
  } = useComponentSelection(roomType);

  // Component expansion
  const {
    expandedComponents,
    setExpandedComponents,
    toggleExpandComponent
  } = useComponentExpansion();

  // Component addition
  const {
    handleAddComponent,
    addCustomComponent
  } = useComponentAddition({
    roomId,
    roomType,
    selectedComponentType,
    components,
    updateComponents,
    expandedComponents,
    setExpandedComponents,
    setSelectedComponentType
  });

  // Component actions
  const {
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode
  } = useComponentActions({
    components,
    updateComponents
  });

  // Component image handling with property and room names
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

  // Handle component processing state changes
  const handleComponentProcessingState = (componentId: string, isProcessing: boolean) => {
    console.log(`📸 Component ${componentId} processing state: ${isProcessing} for property: ${propertyName}, room: ${roomName}`);
    setProcessingState(componentId, isProcessing);
  };

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
}
