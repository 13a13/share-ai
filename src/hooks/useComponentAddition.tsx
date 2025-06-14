
import { useToast } from "@/components/ui/use-toast";
import { ConditionRating, RoomComponent } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UseComponentAdditionProps {
  selectedComponentType: string;
  components: RoomComponent[];
  setComponents: (components: RoomComponent[]) => void;
  onChange: (updatedComponents: RoomComponent[]) => void;
  availableComponents: Array<{ name: string; type: string; isOptional: boolean }>;
}

export function useComponentAddition({
  selectedComponentType,
  components,
  setComponents,
  onChange,
  availableComponents
}: UseComponentAdditionProps) {
  const { toast } = useToast();

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
    }
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
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    toast({
      title: "Component added",
      description: `${componentToAdd.name} has been added to the room inspection.`,
    });
  };

  const addCustomComponent = (name: string) => {
    const newComponentId = uuidv4();
    
    const customType = `custom_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    const updatedComponents = [
      ...components,
      {
        id: newComponentId,
        name: name,
        type: customType,
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
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
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
