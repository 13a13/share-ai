
import { useState } from "react";
import { RoomType, RoomComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ComponentSelector from "./ComponentSelector";
import ComponentItem from "./ComponentItem";
import AddCustomComponent from "./AddCustomComponent";

interface ComponentListProps {
  roomType: RoomType;
  components: RoomComponent[];
  isProcessing: Record<string, boolean>;
  expandedComponents: string[];
  selectedComponentType: string;
  availableComponents: string[];
  propertyName?: string;
  roomName?: string;
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
  components,
  isProcessing,
  expandedComponents,
  selectedComponentType,
  availableComponents,
  propertyName,
  roomName,
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
  const [showCustomComponent, setShowCustomComponent] = useState(false);

  console.log(`🏗️ ComponentList: propertyName="${propertyName}", roomName="${roomName}"`);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Room Components</h3>
        
        <div className="flex gap-2 flex-wrap">
          <ComponentSelector
            roomType={roomType}
            selectedType={selectedComponentType}
            availableComponents={availableComponents}
            onSelect={onSelectComponent}
          />
          
          <Button 
            onClick={onAddComponent}
            disabled={!selectedComponentType}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Component
          </Button>
          
          <Button 
            onClick={() => setShowCustomComponent(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Custom
          </Button>
        </div>

        {showCustomComponent && (
          <AddCustomComponent
            onAdd={(name) => {
              onAddCustomComponent(name);
              setShowCustomComponent(false);
            }}
            onCancel={() => setShowCustomComponent(false)}
          />
        )}
      </div>

      <div className="space-y-3">
        {components.map((component) => (
          <ComponentItem
            key={component.id}
            component={component}
            roomType={roomType}
            propertyName={propertyName}
            roomName={roomName}
            isExpanded={expandedComponents.includes(component.id)}
            isProcessing={isProcessing[component.id] || false}
            onToggleExpand={() => onToggleExpand(component.id)}
            onRemove={() => onRemoveComponent(component.id)}
            onToggleEditMode={() => onToggleEditMode(component.id)}
            onUpdate={(updates) => onUpdateComponent(component.id, updates)}
            onRemoveImage={(imageId) => onRemoveImage(component.id, imageId)}
            onImageProcessed={(imageUrls, result) => onImageProcessed(component.id, imageUrls, result)}
            onProcessingStateChange={(isProcessing) => onProcessingStateChange(component.id, isProcessing)}
          />
        ))}
      </div>
    </div>
  );
};

export default ComponentList;
