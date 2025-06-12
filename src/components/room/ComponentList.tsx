
import { RoomComponent } from "@/types";
import ComponentItem from "./ComponentItem";
import ComponentSelector from "./ComponentSelector";
import AddCustomComponent from "./AddCustomComponent";
import { ROOM_COMPONENT_CONFIGS } from "@/utils/roomComponentUtils";

interface ComponentListProps {
  roomType: string;
  components: RoomComponent[];
  isProcessing: { [key: string]: boolean };
  expandedComponents: string[];
  selectedComponentType: string;
  availableComponents: any[];
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
  
  // Get property name and room name from the DOM
  const reportElement = document.querySelector('[data-report-id]');
  const roomElement = document.querySelector('[data-room-id]');
  const propertyName = reportElement?.getAttribute('data-property-name') || undefined;
  const roomName = roomElement?.getAttribute('data-room-name') || undefined;

  // Get room components that are already added
  const addedComponentNames = components.map(c => c.name);
  
  // Filter available components to show only those not added yet
  const availableToAdd = availableComponents.filter(
    comp => !addedComponentNames.includes(comp.name)
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Components</h3>
        
        {/* Component list */}
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
        
        {/* Add new components */}
        {availableToAdd.length > 0 && (
          <ComponentSelector
            roomType={roomType}
            availableComponents={availableToAdd}
            selectedComponentType={selectedComponentType}
            onSelectComponent={onSelectComponent}
            onAddComponent={onAddComponent}
          />
        )}
        
        {/* Add custom component */}
        <AddCustomComponent onAddCustomComponent={onAddCustomComponent} />
      </div>
    </div>
  );
};

export default ComponentList;
