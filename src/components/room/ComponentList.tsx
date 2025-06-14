
import { RoomType, RoomComponent } from "@/types";
import ComponentSelector from "./ComponentSelector";
import ComponentItem from "./ComponentItem";
import AddCustomComponent from "./AddCustomComponent";

interface ComponentListProps {
  roomType: RoomType;
  propertyName?: string;
  roomName?: string;
  components: RoomComponent[];
  isProcessing: Record<string, boolean>;
  expandedComponents: string[];
  selectedComponentType: string;
  availableComponents: Array<{ name: string; type: string; isOptional: boolean }>;
  onSelectComponent: (type: string) => void;
  onAddComponent: () => void;
  onAddCustomComponent: (name: string) => void;
  onToggleExpand: (componentId: string) => void;
  onRemoveComponent: (componentId: string) => void;
  onToggleEditMode: (componentId: string) => void;
  onUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void;
  onRemoveImage: (componentId: string, imageId: string) => void;
  onImageProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
}

const ComponentList = ({
  roomType,
  propertyName,
  roomName,
  components,
  isProcessing,
  expandedComponents,
  selectedComponentType,
  availableComponents,
  onSelectComponent,
  onAddComponent,
  onAddCustomComponent,
  onToggleExpand,
  onRemoveComponent,
  onToggleEditMode,
  onUpdateComponent,
  onRemoveImage,
  onImageProcessed,
  onProcessingStateChange
}: ComponentListProps) => {
  
  console.log(`📋 ComponentList for room "${roomName}" in property "${propertyName}" with ${components.length} components`);
  
  return (
    <div className="space-y-4">
      {/* Component Selector */}
      <ComponentSelector
        selectedComponentType={selectedComponentType}
        availableComponents={availableComponents}
        onSelectComponent={onSelectComponent}
        onAddComponent={onAddComponent}
      />

      {/* Add Custom Component */}
      <AddCustomComponent onAddComponent={onAddCustomComponent} />

      {/* Component List */}
      <div className="space-y-4">
        {components.map((component) => (
          <ComponentItem
            key={component.id}
            component={component}
            roomType={roomType}
            propertyName={propertyName}
            roomName={roomName}
            isExpanded={expandedComponents.includes(component.id)}
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
      </div>
    </div>
  );
};

export default ComponentList;
