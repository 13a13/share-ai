
import { useToast } from "@/components/ui/use-toast";
import { ConditionRating, RoomComponent, RoomType } from "@/types";
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";
import { v4 as uuidv4 } from "uuid";

interface UseComponentAdditionProps {
  roomId: string;
  roomType: RoomType;
  selectedComponentType: string;
  components: RoomComponent[];
  updateComponents: (components: RoomComponent[]) => void;
  expandedComponents: string[];
  setExpandedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedComponentType: React.Dispatch<React.SetStateAction<string>>;
}

export function useComponentAddition({
  roomId,
  roomType,
  selectedComponentType,
  components,
  updateComponents,
  expandedComponents,
  setExpandedComponents,
  setSelectedComponentType
}: UseComponentAdditionProps) {
  const { toast } = useToast();

  const handleAddComponent = () => {
    if (!selectedComponentType) return;
    
    const availableComponents = getDefaultComponentsByRoomType(roomType);
    const componentToAdd = availableComponents.find(
      comp => comp.name === selectedComponentType
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
  };

  const addComponentToRoom = (componentToAdd: { name: string; type: string; isOptional: boolean }) => {
    const newComponentId = uuidv4();
    
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
    
    updateComponents(updatedComponents);
    setExpandedComponents([...expandedComponents, newComponentId]);
    setSelectedComponentType("");
    
    toast({
      title: "Component added",
      description: `${componentToAdd.name} has been added to the room inspection.`,
    });
  };

  const addCustomComponent = (name: string) => {
    const newComponentId = uuidv4();
    
    const updatedComponents = [
      ...components,
      {
        id: newComponentId,
        name: name,
        type: `custom_${Date.now()}`,
        description: "",
        condition: "fair" as ConditionRating,
        conditionSummary: "",
        notes: "",
        images: [],
        isOptional: true,
        isEditing: true,
        isCustom: true,
      } as RoomComponent
    ];
    
    updateComponents(updatedComponents);
    setExpandedComponents([...expandedComponents, newComponentId]);
    
    toast({
      title: "Custom component added",
      description: `"${name}" has been added to the room inspection.`,
    });
  };

  return {
    handleAddComponent,
    addCustomComponent
  };
}
