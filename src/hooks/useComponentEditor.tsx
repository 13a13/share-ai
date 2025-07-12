import { useState, useCallback } from "react";
import { RoomComponent } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export interface ComponentEditState {
  editingComponents: Set<string>;
  pendingChanges: Map<string, Partial<RoomComponent>>;
}

export const useComponentEditor = (
  components: RoomComponent[],
  onUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void
) => {
  const { toast } = useToast();
  const [editingComponents, setEditingComponents] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<RoomComponent>>>(new Map());

  // Toggle edit mode for a component
  const toggleEditMode = useCallback((componentId: string) => {
    setEditingComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
        // Clear pending changes when exiting edit mode without saving
        setPendingChanges(prev => {
          const newMap = new Map(prev);
          newMap.delete(componentId);
          return newMap;
        });
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  }, []);

  // Update a field for a component in edit mode
  const updateField = useCallback((componentId: string, field: string, value: string | string[]) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const currentChanges = newMap.get(componentId) || {};
      newMap.set(componentId, {
        ...currentChanges,
        [field]: value
      });
      return newMap;
    });
  }, []);

  // Save changes for a component
  const saveComponent = useCallback((componentId: string) => {
    const changes = pendingChanges.get(componentId);
    if (changes && Object.keys(changes).length > 0) {
      try {
        // Apply the changes to the component
        onUpdateComponent(componentId, changes);
        
        // Clear pending changes and exit edit mode
        setPendingChanges(prev => {
          const newMap = new Map(prev);
          newMap.delete(componentId);
          return newMap;
        });
        
        setEditingComponents(prev => {
          const newSet = new Set(prev);
          newSet.delete(componentId);
          return newSet;
        });

        toast({
          title: "Component Updated",
          description: "Your changes have been saved successfully.",
        });
      } catch (error) {
        console.error("Error saving component:", error);
        toast({
          title: "Error",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // No changes, just exit edit mode
      setEditingComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(componentId);
        return newSet;
      });
    }
  }, [pendingChanges, onUpdateComponent, toast]);

  // Cancel editing for a component
  const cancelEdit = useCallback((componentId: string) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(componentId);
      return newMap;
    });
    
    setEditingComponents(prev => {
      const newSet = new Set(prev);
      newSet.delete(componentId);
      return newSet;
    });
  }, []);

  // Get the current state of a component (with pending changes applied)
  const getComponentState = useCallback((componentId: string): RoomComponent => {
    const component = components.find(c => c.id === componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    const changes = pendingChanges.get(componentId) || {};
    return {
      ...component,
      ...changes,
      isEditing: editingComponents.has(componentId)
    };
  }, [components, pendingChanges, editingComponents]);

  // Check if a component is being edited
  const isEditing = useCallback((componentId: string) => {
    return editingComponents.has(componentId);
  }, [editingComponents]);

  // Check if a component has pending changes
  const hasPendingChanges = useCallback((componentId: string) => {
    const changes = pendingChanges.get(componentId);
    return changes && Object.keys(changes).length > 0;
  }, [pendingChanges]);

  return {
    isEditing,
    hasPendingChanges,
    getComponentState,
    toggleEditMode,
    updateField,
    saveComponent,
    cancelEdit
  };
};