import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ConditionRating, RoomType, RoomComponent } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import ComponentItem from "./ComponentItem";
import ComponentsEmptyState from "./ComponentsEmptyState";
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";

interface ComponentItem extends RoomComponent {
  isEditing?: boolean;
}

interface RoomComponentInspectionProps {
  reportId: string;
  roomId: string;
  roomType: RoomType;
  components: ComponentItem[];
  onChange: (updatedComponents: ComponentItem[]) => void;
}

const RoomComponentInspection = ({ 
  reportId, 
  roomId, 
  roomType, 
  components, 
  onChange 
}: RoomComponentInspectionProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState<string>("");

  const handleAddComponent = () => {
    if (!selectedComponentType) {
      const availableComponents = getDefaultComponentsByRoomType(roomType).filter(
        comp => !components.some(c => c.type === comp.type)
      );
      
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
      } as ComponentItem
    ];
    
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
    
    const updatedComponents = components.map(comp => {
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

  const availableComponents = getDefaultComponentsByRoomType(roomType).filter(
    comp => !components.some(c => c.type === comp.type)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-lg font-medium">Room Components</h3>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          {availableComponents.length > 0 && (
            <div className="w-full sm:w-64">
              <Select 
                value={selectedComponentType} 
                onValueChange={setSelectedComponentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select component to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableComponents.map((comp) => (
                    <SelectItem key={comp.type} value={comp.type}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button 
            onClick={handleAddComponent}
            variant="outline" 
            className="flex items-center gap-1"
            disabled={availableComponents.length === 0}
          >
            <Plus className="h-4 w-4" /> Add Component
          </Button>
        </div>
      </div>
      
      {components.length === 0 ? (
        <ComponentsEmptyState onAddComponent={handleAddComponent} />
      ) : (
        <Accordion
          type="multiple"
          value={expandedComponents}
          onValueChange={setExpandedComponents}
          className="space-y-4"
        >
          {components.map((component) => (
            <ComponentItem 
              key={component.id}
              component={component}
              roomType={roomType}
              expanded={expandedComponents.includes(component.id)}
              isProcessing={isProcessing[component.id] || false}
              onToggleExpand={toggleExpandComponent}
              onRemoveComponent={handleRemoveComponent}
              onToggleEditMode={toggleEditMode}
              onUpdateComponent={handleUpdateComponent}
              onRemoveImage={handleRemoveImage}
              onImageProcessed={handleImageProcessed}
              onProcessingStateChange={handleComponentProcessingState}
            />
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default RoomComponentInspection;
