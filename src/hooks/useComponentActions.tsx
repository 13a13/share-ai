
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { RoomComponent, ConditionRating } from "@/types";

interface UseComponentActionsProps {
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

export function useComponentActions({
  initialComponents,
  onChange
}: UseComponentActionsProps) {
  const { toast } = useToast();
  const [components, setComponents] = useState<RoomComponent[]>(initialComponents);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

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

  const handleComponentProcessingState = (componentId: string, processing: boolean) => {
    setIsProcessing((prev) => ({ ...prev, [componentId]: processing }));
  };

  return {
    components,
    isProcessing,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode,
    handleRemoveImage,
    handleComponentProcessingState,
    setComponents
  };
}
