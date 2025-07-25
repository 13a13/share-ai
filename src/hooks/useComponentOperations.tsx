import { RoomComponent } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";

interface ComponentConfig {
  name: string;
  type: string;
  isOptional?: boolean;
}

interface UseComponentOperationsProps {
  components: RoomComponent[];
  updateComponents: (updatedComponents: RoomComponent[]) => void;
  expandedComponents: string[];
  setExpandedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  availableComponents: ComponentConfig[];
  selectedComponentType: string;
  setSelectedComponentType: React.Dispatch<React.SetStateAction<string>>;
}

interface UseComponentOperationsReturn {
  handleAddComponent: () => void;
  addCustomComponent: (name: string) => void;
  handleRemoveComponent: (componentId: string) => void;
  handleUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void;
  toggleEditMode: (componentId: string) => void;
}

export function useComponentOperations({
  components,
  updateComponents,
  expandedComponents,
  setExpandedComponents,
  availableComponents,
  selectedComponentType,
  setSelectedComponentType
}: UseComponentOperationsProps): UseComponentOperationsReturn {
  const { toast } = useToast();

  const handleAddComponent = () => {
    console.log("🔧 handleAddComponent called", { 
      selectedComponentType, 
      availableComponents: availableComponents.map(c => c.name),
      componentsCount: components.length 
    });

    if (!selectedComponentType) {
      console.log("❌ No component type selected");
      return;
    }

    const config = availableComponents.find(c => c.name === selectedComponentType);
    if (!config) {
      console.log("❌ Component config not found for:", selectedComponentType);
      return;
    }

    console.log("✅ Adding component:", config);

    const newComponent: RoomComponent = {
      id: uuidv4(),
      name: config.name,
      type: config.type,
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
    updateComponents(updatedComponents);
    setSelectedComponentType("");
    
    // Auto-expand the new component
    setExpandedComponents([...expandedComponents, newComponent.id]);
    
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
      type: "custom",
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
    updateComponents(updatedComponents);
    
    // Auto-expand the new component
    setExpandedComponents([...expandedComponents, newComponent.id]);
    
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
    updateComponents(updatedComponents);
    
    // Remove from expanded state
    setExpandedComponents(expandedComponents.filter(id => id !== componentId));

    toast({
      title: "Component Removed",
      description: "The component has been removed from the room.",
    });
  };

  const handleUpdateComponent = (componentId: string, updates: Partial<RoomComponent>) => {
    const updatedComponents = components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    );
    updateComponents(updatedComponents);
  };

  const toggleEditMode = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    handleUpdateComponent(componentId, { isEditing: !component.isEditing });
    
    // Ensure component is expanded when entering edit mode
    if (!component.isEditing && !expandedComponents.includes(componentId)) {
      setExpandedComponents([...expandedComponents, componentId]);
    }
  };

  return {
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode
  };
}
