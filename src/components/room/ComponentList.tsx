
import { RoomComponent } from "@/types";
import ComponentItem from "./ComponentItem";
import ComponentSelector from "./ComponentSelector";
import AddCustomComponent from "./AddCustomComponent";
import GlobalAnalysisControls from "./GlobalAnalysisControls";
import { ROOM_COMPONENT_CONFIGS } from "@/utils/roomComponentUtils";
import { BatchAnalysisProgress, ComponentStagingData } from "@/types";
import { useComponentEditor } from "@/hooks/useComponentEditor";

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
  
  // New batch analysis props with proper types
  componentStaging: Map<string, ComponentStagingData>;
  analysisProgress: Map<string, BatchAnalysisProgress>;
  globalProcessing: boolean;
  onAnalyzeAll: () => Promise<void>;
  onClearAllStaging: () => void;
  onAddStagedImages: (componentId: string, images: string[]) => void;
  onRemoveStagedImage: (componentId: string, imageIndex: number) => void;
  onProcessStagedComponent: (componentId: string) => Promise<void>;
  onClearComponentStaging: (componentId: string) => void;
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
  onProcessingStateChange,
  componentStaging,
  analysisProgress,
  globalProcessing,
  onAnalyzeAll,
  onClearAllStaging,
  onAddStagedImages,
  onRemoveStagedImage,
  onProcessStagedComponent,
  onClearComponentStaging
}: ComponentListProps) => {
  
  // Use the component editor hook for enhanced editing functionality
  const componentEditor = useComponentEditor(components, onUpdateComponent);
  
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

  const totalStagedImages = Array.from(componentStaging.values())
    .reduce((total, comp) => total + comp.stagedImages.length, 0);

  const componentsWithStaging = Array.from(componentStaging.values())
    .filter(comp => comp.stagedImages.length > 0);

  return (
    <div className="space-y-4">
      {/* Global Analysis Controls */}
      <GlobalAnalysisControls
        totalStagedImages={totalStagedImages}
        componentsWithStaging={componentsWithStaging}
        analysisProgress={analysisProgress}
        globalProcessing={globalProcessing}
        onAnalyzeAll={onAnalyzeAll}
        onClearAll={onClearAllStaging}
      />
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Components</h3>
        
        {/* Component list */}
        <div className="space-y-3">
          {components.map((component) => {
            // Get the component state with any pending edits applied
            const componentWithEdits = componentEditor.getComponentState(component.id);
            
            return (
              <ComponentItem
                key={component.id}
                component={componentWithEdits}
                roomType={roomType}
                propertyName={propertyName}
                roomName={roomName}
                isExpanded={expandedComponents.includes(component.id)}
                isProcessing={isProcessing[component.id] || false}
                onToggleExpand={() => onToggleExpand(component.id)}
                onRemove={() => onRemoveComponent(component.id)}
                onToggleEditMode={() => componentEditor.toggleEditMode(component.id)}
                onUpdate={(updates) => onUpdateComponent(component.id, updates)}
                onRemoveImage={(imageId) => onRemoveImage(component.id, imageId)}
                onImageProcessed={(imageUrls, result) => onImageProcessed(component.id, imageUrls, result)}
                onProcessingStateChange={(isProcessing) => onProcessingStateChange(component.id, isProcessing)}
                stagedImages={componentStaging.get(component.id)?.stagedImages || []}
                onAddStagedImages={onAddStagedImages}
                onRemoveStagedImage={onRemoveStagedImage}
                onProcessStagedComponent={onProcessStagedComponent}
                onClearComponentStaging={onClearComponentStaging}
                stagingProcessing={componentStaging.get(component.id)?.isProcessing || false}
              />
            );
          })}
        </div>
        
        {/* Add new components */}
        {availableToAdd.length > 0 && (
          <ComponentSelector
            availableComponents={availableToAdd}
            selectedComponentType={selectedComponentType}
            onSelectComponent={onSelectComponent}
            onAddComponent={onAddComponent}
          />
        )}
        
        {/* Add custom component */}
        <AddCustomComponent onAddComponent={onAddCustomComponent} />
      </div>
    </div>
  );
};

export default ComponentList;
