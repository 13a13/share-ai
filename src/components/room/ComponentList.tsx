
import { Accordion } from "@/components/ui/accordion";
import { RoomComponent, RoomType } from "@/types";
import ComponentItem from "./ComponentItem";
import ComponentsEmptyState from "../ComponentsEmptyState";
import ComponentSelector from "./ComponentSelector";

interface ComponentListProps {
  roomType: RoomType;
  components: RoomComponent[];
  isProcessing: Record<string, boolean>;
  expandedComponents: string[];
  selectedComponentType: string;
  availableComponents: Array<{ name: string; type: string; isOptional: boolean }>;
  onSelectComponent: (value: string) => void;
  onAddComponent: () => void;
  onToggleExpand: (componentId: string) => void;
  onRemoveComponent: (componentId: string) => void;
  onToggleEditMode: (componentId: string) => void;
  onUpdateComponent: (componentId: string, field: string, value: string) => void;
  onRemoveImage: (componentId: string, imageId: string) => void;
  onImageProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
}

const ComponentList = ({
  roomType,
  components,
  isProcessing,
  expandedComponents,
  selectedComponentType,
  availableComponents,
  onSelectComponent,
  onAddComponent,
  onToggleExpand,
  onRemoveComponent,
  onToggleEditMode,
  onUpdateComponent,
  onRemoveImage,
  onImageProcessed,
  onProcessingStateChange
}: ComponentListProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-lg font-medium">Room Components</h3>
        <ComponentSelector 
          selectedComponentType={selectedComponentType}
          availableComponents={availableComponents}
          onSelectComponent={onSelectComponent}
          onAddComponent={onAddComponent}
        />
      </div>
      
      {components.length === 0 ? (
        <ComponentsEmptyState onAddComponent={onAddComponent} />
      ) : (
        <Accordion
          type="multiple"
          value={expandedComponents}
          className="space-y-4"
        >
          {components.map((component) => (
            <ComponentItem 
              key={component.id}
              component={component}
              roomType={roomType}
              expanded={expandedComponents.includes(component.id)}
              isProcessing={isProcessing[component.id] || false}
              onToggleExpand={onToggleExpand}
              onRemoveComponent={onRemoveComponent}
              onToggleEditMode={onToggleEditMode}
              onUpdateComponent={onUpdateComponent}
              onRemoveImage={onRemoveImage}
              onImageProcessed={onImageProcessed}
              onProcessingStateChange={onProcessingStateChange}
            />
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default ComponentList;
