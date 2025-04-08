
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";
import { ConditionRating, RoomComponent, RoomType } from "@/types";
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";

export interface ComponentItem extends RoomComponent {
  isEditing?: boolean;
}

export const useRoomComponents = (
  initialComponents: ComponentItem[],
  roomType: RoomType,
  onChange: (updatedComponents: ComponentItem[]) => void
) => {
  const { toast } = useToast();
  
  const addComponent = (componentType: string) => {
    const componentToAdd = getDefaultComponentsByRoomType(roomType).find(
      comp => comp.type === componentType
    );
    
    if (!componentToAdd) {
      toast({
        title: "Component not found",
        description: "The selected component type is not valid for this room.",
        variant: "destructive",
      });
      return;
    }
    
    const newComponentId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updatedComponents = [
      ...initialComponents,
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
      } as ComponentItem
    ];
    
    onChange(updatedComponents);
    
    toast({
      title: "Component added",
      description: `${componentToAdd.name} has been added to the room inspection.`,
    });

    return newComponentId;
  };

  const removeComponent = (componentId: string) => {
    const component = initialComponents.find(c => c.id === componentId);
    
    if (!component) return;
    
    if (!component.isOptional) {
      toast({
        title: "Cannot remove component",
        description: `${component.name} is a required component for this room type.`,
        variant: "destructive",
      });
      return;
    }
    
    const updatedComponents = initialComponents.filter(c => c.id !== componentId);
    onChange(updatedComponents);
    
    toast({
      title: "Component removed",
      description: `${component.name} has been removed from the room inspection.`,
    });
  };

  const updateComponent = (componentId: string, field: string, value: string) => {
    const updatedComponents = initialComponents.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          [field]: value,
        };
      }
      return comp;
    });
    
    onChange(updatedComponents);
  };

  const toggleEditMode = (componentId: string) => {
    const updatedComponents = initialComponents.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          isEditing: !comp.isEditing,
        };
      }
      return comp;
    });
    
    onChange(updatedComponents);
  };

  const removeImage = (componentId: string, imageId: string) => {
    const updatedComponents = initialComponents.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          images: comp.images.filter(img => img.id !== imageId),
        };
      }
      return comp;
    });
    
    onChange(updatedComponents);
  };

  const handleImageProcessed = (
    componentId: string, 
    imageUrl: string, 
    result: { 
      description?: string; 
      condition?: ConditionRating; 
      notes?: string;
    }
  ) => {
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updatedComponents = initialComponents.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          description: result.description || comp.description,
          condition: result.condition || comp.condition,
          notes: result.notes ? (comp.notes ? `${comp.notes}\n\nAI Suggested: ${result.notes}` : result.notes) : (comp.notes || ""),
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
    
    onChange(updatedComponents);
  };

  return {
    addComponent,
    removeComponent,
    updateComponent,
    toggleEditMode,
    removeImage,
    handleImageProcessed
  };
};
