
import { useToast } from "@/components/ui/use-toast";
import { RoomComponent } from "@/types";

interface UseComponentActionsProps {
  components: RoomComponent[];
  updateComponents: (updatedComponents: RoomComponent[]) => void;
}

export function useComponentActions({
  components,
  updateComponents
}: UseComponentActionsProps) {
  const { toast } = useToast();

  const handleRemoveComponent = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    
    if (!component) return;
    
    const updatedComponents = components.filter(c => c.id !== componentId);
    updateComponents(updatedComponents);
    
    toast({
      title: "Component removed",
      description: `${component.name} has been removed from the room inspection.`,
    });
  };

  const handleUpdateComponent = (componentId: string, updates: Partial<RoomComponent>) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          ...updates,
        };
      }
      return comp;
    });
    
    updateComponents(updatedComponents);
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
    
    updateComponents(updatedComponents);
  };

  return {
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode
  };
}
