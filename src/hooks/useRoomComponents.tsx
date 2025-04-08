
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ConditionRating, RoomComponent, RoomType } from "@/types";
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";
import { processComponentImage } from "@/services/imageProcessingService";

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
  const { toast } = useToast();
  const [components, setComponents] = useState<RoomComponent[]>(initialComponents);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState<string>("");

  const availableComponents = getDefaultComponentsByRoomType(roomType).filter(
    comp => !components.some(c => c.type === comp.type)
  );

  const handleAddComponent = () => {
    if (!selectedComponentType) {
      if (availableComponents.length === 0) {
        toast({
          title: "No more components available",
          description: "All possible components for this room type have been added.",
        });
        return;
      }
      
      const newComponent = availableComponents[0];
      addComponentToRoom(newComponent);
    } else {
      const componentToAdd = getDefaultComponentsByRoomType(roomType).find(
        comp => comp.type === selectedComponentType
      );
      
      if (!componentToAdd) {
        toast({
          title: "Component not found",
          description: "The selected component type is not valid for this room.",
          variant: "destructive",
        });
        return;
      }
      
      addComponentToRoom(componentToAdd);
      setSelectedComponentType("");
    }
  };

  const addComponentToRoom = (componentToAdd: { name: string; type: string; isOptional: boolean }) => {
    const newComponentId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updatedComponents = [
      ...components,
      {
        id: newComponentId,
        name: componentToAdd.name,
        type: componentToAdd.type,
        description: "",
        condition: "fair" as ConditionRating,
        notes: "",
        images: [],
        isOptional: componentToAdd.isOptional,
        isEditing: true,
      } as RoomComponent
    ];
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    setExpandedComponents([...expandedComponents, newComponentId]);
    
    toast({
      title: "Component added",
      description: `${componentToAdd.name} has been added to the room inspection.`,
    });
  };

  const handleRemoveComponent = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    
    if (!component) return;
    
    if (!component.isOptional) {
      toast({
        title: "Cannot remove component",
        description: `${component.name} is a required component for this room type.`,
        variant: "destructive",
      });
      return;
    }
    
    const updatedComponents = components.filter(c => c.id !== componentId);
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    setExpandedComponents(expandedComponents.filter(id => id !== componentId));
    
    toast({
      title: "Component removed",
      description: `${component.name} has been removed from the room inspection.`,
    });
  };

  const handleUpdateComponent = (componentId: string, field: string, value: string) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          [field]: value,
        };
      }
      return comp;
    });
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
  };

  const toggleEditMode = (componentId: string) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          isEditing: !comp.isEditing,
        };
      }
      return comp;
    });
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
  };

  const handleRemoveImage = (componentId: string, imageId: string) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          images: comp.images.filter(img => img.id !== imageId),
        };
      }
      return comp;
    });
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
  };

  const handleImageProcessed = (
    componentId: string, 
    imageUrl: string, 
    result: { 
      description?: string; 
      condition?: {
        summary?: string;
        rating?: ConditionRating;
      }; 
      notes?: string;
    }
  ) => {
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          description: result.description || comp.description,
          condition: result.condition?.rating || comp.condition,
          conditionSummary: result.condition?.summary || comp.conditionSummary,
          notes: result.notes ? (comp.notes ? `${comp.notes}\n\n${result.notes}` : result.notes) : comp.notes,
          images: [
            ...comp.images,
            {
              id: imageId,
              url: imageUrl,
              timestamp: new Date(),
            }
          ],
          isEditing: true
        };
      }
      return comp;
    });
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    if (!expandedComponents.includes(componentId)) {
      setExpandedComponents([...expandedComponents, componentId]);
    }
  };

  const handleComponentProcessingState = (componentId: string, processing: boolean) => {
    setIsProcessing((prev) => ({ ...prev, [componentId]: processing }));
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
    setSelectedComponentType,
    handleAddComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode,
    handleRemoveImage,
    handleImageProcessed,
    handleComponentProcessingState,
    toggleExpandComponent
  };
}
