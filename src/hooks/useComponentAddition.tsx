
import { useToast } from "@/components/ui/use-toast";
import { ConditionRating, RoomComponent, RoomType } from "@/types";
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";

interface UseComponentAdditionProps {
  roomType: RoomType;
  components: RoomComponent[];
  expandedComponents: string[];
  selectedComponentType: string;
  setComponents: (components: RoomComponent[]) => void;
  setExpandedComponents: (ids: string[]) => void;
  onChange: (updatedComponents: RoomComponent[]) => void;
}

export function useComponentAddition({
  roomType,
  components,
  expandedComponents,
  selectedComponentType,
  setComponents,
  setExpandedComponents,
  onChange
}: UseComponentAdditionProps) {
  const { toast } = useToast();

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
        conditionSummary: "",
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

  return {
    handleAddComponent
  };
}
