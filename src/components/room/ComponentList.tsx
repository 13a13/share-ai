
import { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { RoomComponent, RoomType, ConditionRating } from "@/types";
import ComponentItem from "../ComponentItem";
import ComponentsEmptyState from "../ComponentsEmptyState";

interface ComponentListProps {
  components: Array<RoomComponent & { isEditing?: boolean }>;
  roomType: RoomType;
  onEmptyAddComponent: () => void;
  onRemoveComponent: (componentId: string) => void;
  onToggleEditMode: (componentId: string) => void;
  onUpdateComponent: (componentId: string, field: string, value: string) => void;
  onRemoveImage: (componentId: string, imageId: string) => void;
  onImageProcessed: (
    componentId: string, 
    imageUrl: string, 
    result: { description?: string; condition?: ConditionRating; notes?: string }
  ) => void;
}

const ComponentList = ({
  components,
  roomType,
  onEmptyAddComponent,
  onRemoveComponent,
  onToggleEditMode,
  onUpdateComponent,
  onRemoveImage,
  onImageProcessed
}: ComponentListProps) => {
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

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

  if (components.length === 0) {
    return <ComponentsEmptyState onAddComponent={onEmptyAddComponent} />;
  }

  return (
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
          onRemoveComponent={onRemoveComponent}
          onToggleEditMode={onToggleEditMode}
          onUpdateComponent={onUpdateComponent}
          onRemoveImage={onRemoveImage}
          onImageProcessed={onImageProcessed}
          onProcessingStateChange={handleComponentProcessingState}
        />
      ))}
    </Accordion>
  );
};

export default ComponentList;
