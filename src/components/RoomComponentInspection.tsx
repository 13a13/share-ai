
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
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

  const handleAddComponent = () => {
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
    const newComponentId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updatedComponents = [
      ...components,
      {
        id: newComponentId,
        name: newComponent.name,
        type: newComponent.type,
        description: "",
        condition: "fair" as ConditionRating,
        notes: "",
        images: [],
        isOptional: newComponent.isOptional,
        isEditing: true,
      } as ComponentItem
    ];
    
    onChange(updatedComponents);
    
    setExpandedComponents([...expandedComponents, newComponentId]);
    
    toast({
      title: "Component added",
      description: `${newComponent.name} has been added to the room inspection.`,
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
      imageId: string;
      timestamp: Date;
    }
  ) => {
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
              id: result.imageId,
              url: imageUrl,
              timestamp: result.timestamp,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Room Components</h3>
        <Button 
          onClick={handleAddComponent}
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add Component
        </Button>
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
