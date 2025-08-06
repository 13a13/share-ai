import { RoomComponent } from "@/types";
import UnifiedComponentItem from "./UnifiedComponentItem";
import ComponentSelector from "./ComponentSelector";
import AddCustomComponent from "./AddCustomComponent";
import GlobalAnalysisControls from "./GlobalAnalysisControls";
import { ROOM_COMPONENT_CONFIGS } from "@/utils/roomComponentUtils";
import { BatchAnalysisProgress, ComponentStagingData } from "@/types";

interface ComponentListProps {
  roomType: string;
  propertyName: string;
  roomName: string;
  components: RoomComponent[];
  isProcessing: { [key: string]: boolean };
  expandedComponents: string[];
  selectedComponentType: string;
  // Staging props
  componentStaging: ComponentStagingData[];
  analysisProgress: BatchAnalysisProgress;
  stagingProcessing: { [key: string]: boolean };
  // Event handlers
  onToggleExpand: (componentId: string) => void;
  onRemoveComponent: (componentId: string) => void;
  onToggleEditMode: (componentId: string) => void;
  onUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void;
  onRemoveImage: (componentId: string, imageId: string) => void;
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  onAddCustomComponent: (name: string, type: string) => void;
  onSelectedComponentTypeChange: (type: string) => void;
  onAddComponent: (name: string) => void;
  // Staging handlers
  onAddStagedImages: (componentId: string, images: string[]) => void;
  onRemoveStagedImage: (componentId: string, imageIndex: number) => void;
  onProcessStagedComponent: (componentId: string) => Promise<void>;
  onClearComponentStaging: (componentId: string) => void;
  onAnalyzeAll: () => Promise<void>;
  onClearAllStaging: () => void;
  // Direct save handler
  onSaveComponent: (componentId: string) => Promise<void>;
}

const ComponentList = ({
  roomType,
  propertyName,
  roomName,
  components,
  isProcessing,
  expandedComponents,
  selectedComponentType,
  componentStaging,
  analysisProgress,
  stagingProcessing,
  onToggleExpand,
  onRemoveComponent,
  onToggleEditMode,
  onUpdateComponent,
  onRemoveImage,
  onImagesProcessed,
  onProcessingStateChange,
  onAddCustomComponent,
  onSelectedComponentTypeChange,
  onAddComponent,
  onAddStagedImages,
  onRemoveStagedImage,
  onProcessStagedComponent,
  onClearComponentStaging,
  onAnalyzeAll,
  onClearAllStaging,
  onSaveComponent
}: ComponentListProps) => {
  // Calculate available components for selection
  const availableComponents = ROOM_COMPONENT_CONFIGS[roomType] || [];
  const addedComponentNames = components.map(c => c.name);
  const availableToAdd = availableComponents.filter(
    config => !addedComponentNames.includes(config.name)
  );

  // Calculate staging info for global controls
  const totalStagedImages = componentStaging.reduce((total, staging) => 
    total + staging.stagedImages.length, 0
  );
  const componentsWithStaging = componentStaging.filter(
    staging => staging.stagedImages.length > 0
  );

  return (
    <div className="space-y-4">
      {/* Global Analysis Controls */}
      {componentsWithStaging.length > 0 && (
        <GlobalAnalysisControls
          totalStagedImages={totalStagedImages}
          componentsWithStaging={componentsWithStaging}
          analysisProgress={new Map([['global', analysisProgress]])}
          globalProcessing={false}
          onAnalyzeAll={onAnalyzeAll}
          onClearAll={onClearAllStaging}
        />
      )}
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Components</h3>
        
        {/* Component list */}
        <div className="space-y-3">
          {components.map((component) => {
            const staging = componentStaging.find(s => s.componentId === component.id);
            return (
              <UnifiedComponentItem
                key={component.id}
                component={component}
                roomType={roomType}
                propertyName={propertyName}
                roomName={roomName}
                isExpanded={expandedComponents.includes(component.id)}
                isProcessing={isProcessing[component.id] || false}
                onToggleExpand={() => onToggleExpand(component.id)}
                onRemoveComponent={onRemoveComponent}
                onUpdateComponent={onUpdateComponent}
                onToggleEditMode={onToggleEditMode}
                onRemoveImage={onRemoveImage}
                onImagesProcessed={onImagesProcessed}
                onProcessingStateChange={onProcessingStateChange}
                stagedImages={staging?.stagedImages || []}
                onAddStagedImages={onAddStagedImages}
                onRemoveStagedImage={onRemoveStagedImage}
                onProcessStagedComponent={onProcessStagedComponent}
                onClearComponentStaging={onClearComponentStaging}
                stagingProcessing={stagingProcessing[component.id] || false}
                onSaveComponent={onSaveComponent}
              />
            );
          })}
        </div>
        
        {/* Add Component Controls */}
        <div className="space-y-3 pt-4 border-t">
          <ComponentSelector
            availableComponents={availableToAdd}
            selectedComponentType={selectedComponentType}
            onSelectComponent={onSelectedComponentTypeChange}
            onAddComponent={() => onAddComponent(selectedComponentType)}
          />
          
          <AddCustomComponent onAddComponent={onAddCustomComponent} />
        </div>
      </div>
    </div>
  );
};

export default ComponentList;