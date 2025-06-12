
import { useState, useRef } from "react";
import { RoomComponent, RoomComponentImage } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI } from "@/lib/api";
import { useComponentImageProcessing } from "./useComponentImageProcessing";
import { ROOM_COMPONENT_CONFIGS } from "@/utils/roomComponentUtils";

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
  const { toast } = useToast();
  const [components, setComponents] = useState<RoomComponent[]>(initialComponents);
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({});
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState("");
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get available components for the room type
  const availableComponents = ROOM_COMPONENT_CONFIGS[roomType as keyof typeof ROOM_COMPONENT_CONFIGS] || [];

  // Use the image processing hook
  const { handleImagesProcessed } = useComponentImageProcessing({
    components,
    expandedComponents,
    setComponents,
    setExpandedComponents,
    onChange
  });

  const handleComponentProcessingState = (componentId: string, isProcessing: boolean) => {
    setIsProcessing(prev => ({
      ...prev,
      [componentId]: isProcessing
    }));
  };

  // Modified handleImagesProcessed to include property and room names
  const handleImagesProcessedWithContext = (componentId: string, imageUrls: string[], result: any) => {
    console.log(`🖼️ Images processed for component ${componentId} in property: ${propertyName}, room: ${roomName}`);
    handleImagesProcessed(componentId, imageUrls, result);
  };

  const handleAddComponent = () => {
    if (!selectedComponentType) return;

    const config = availableComponents.find(c => c.name === selectedComponentType);
    if (!config) return;

    const newComponent: RoomComponent = {
      id: uuidv4(),
      name: config.name,
      description: "",
      condition: "fair",
      conditionSummary: "",
      conditionPoints: [],
      cleanliness: "fair",
      notes: "",
      images: [],
      isOptional: config.isOptional || false,
      isEditing: true
    };

    const updatedComponents = [...components, newComponent];
    setComponents(updatedComponents);
    onChange(updatedComponents);
    setSelectedComponentType("");
    
    // Auto-expand the new component
    setExpandedComponents(prev => [...prev, newComponent.id]);
    
    // Scroll to the new component
    setTimeout(() => {
      const element = document.getElementById(`component-${newComponent.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    toast({
      title: "Component Added",
      description: `${config.name} has been added to the room.`,
    });
  };

  const addCustomComponent = (name: string) => {
    const newComponent: RoomComponent = {
      id: uuidv4(),
      name,
      description: "",
      condition: "fair",
      conditionSummary: "",
      conditionPoints: [],
      cleanliness: "fair",
      notes: "",
      images: [],
      isOptional: true,
      isEditing: true
    };

    const updatedComponents = [...components, newComponent];
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    // Auto-expand the new component
    setExpandedComponents(prev => [...prev, newComponent.id]);
    
    // Scroll to the new component
    setTimeout(() => {
      const element = document.getElementById(`component-${newComponent.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    toast({
      title: "Custom Component Added",
      description: `${name} has been added to the room.`,
    });
  };

  const handleRemoveComponent = (componentId: string) => {
    const updatedComponents = components.filter(c => c.id !== componentId);
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    // Remove from expanded state
    setExpandedComponents(prev => prev.filter(id => id !== componentId));

    toast({
      title: "Component Removed",
      description: "The component has been removed from the room.",
    });
  };

  const handleUpdateComponent = (componentId: string, updates: Partial<RoomComponent>) => {
    const updatedComponents = components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    );
    setComponents(updatedComponents);
    onChange(updatedComponents);
  };

  const toggleEditMode = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    handleUpdateComponent(componentId, { isEditing: !component.isEditing });
    
    // Ensure component is expanded when entering edit mode
    if (!component.isEditing && !expandedComponents.includes(componentId)) {
      setExpandedComponents(prev => [...prev, componentId]);
    }
  };

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
    setComponents(updatedComponents);
    onChange(updatedComponents);

    toast({
      title: "Image Removed",
      description: "The image has been removed from the component.",
    });
  };

  const toggleExpandComponent = (componentId: string) => {
    setExpandedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  return {
    components,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
    propertyName, // Export for use in child components
    roomName, // Export for use in child components
    setSelectedComponentType,
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode,
    handleRemoveImage,
    handleImagesProcessed: handleImagesProcessedWithContext,
    handleComponentProcessingState,
    toggleExpandComponent
  };
}
