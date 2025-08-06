
import { Textarea } from "@/components/ui/textarea";
import { Room, RoomComponent } from "@/types";
import { useRoomComponents } from "@/hooks/useRoomComponents";
import ComponentList from "./ComponentList";

interface RoomContentProps {
  reportId: string;
  room: Room;
  propertyName?: string;
  onUpdateGeneralCondition: (roomId: string, generalCondition: string) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
}

const RoomContent = ({
  reportId,
  room,
  propertyName,
  onUpdateGeneralCondition,
  onUpdateComponents
}: RoomContentProps) => {
  // Room components hook
  const {
    components,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
    setSelectedComponentType,
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode,
    handleRemoveImage,
    handleImagesProcessed,
    handleComponentProcessingState,
    toggleExpandComponent,
    componentStaging,
    analysisProgress,
    globalProcessing,
    addStagedImages,
    removeStagedImage,
    clearComponentStaging,
    handleAnalyzeAll,
    handleProcessStagedComponent,
    handleClearAllStaging,
    getTotalStagedImages,
    getComponentsWithStagedImages
  } = useRoomComponents({
    roomId: room.id,
    roomType: room.type,
    propertyName: propertyName,
    roomName: room.name,
    initialComponents: room.components || [],
    onChange: (updatedComponents) => onUpdateComponents(room.id, updatedComponents),
    reportId
  });

  // Wrapper function to match expected signature
  const handleAddStagedImages = (componentId: string, images: string[]) => {
    const component = components.find(c => c.id === componentId);
    const componentName = component?.name || 'Unknown Component';
    addStagedImages(componentId, componentName, images);
  };

  return (
    <div 
      className="px-4 py-3 space-y-4" 
      data-report-id={reportId}
      data-room-id={room.id}
    >
      <div className="space-y-2">
        <h3 className="text-sm font-medium">General Condition</h3>
        <Textarea 
          value={room.generalCondition}
          onChange={(e) => onUpdateGeneralCondition(room.id, e.target.value)}
          placeholder="Describe the general condition of the room..."
          className="min-h-[80px]"
        />
      </div>
      
      <ComponentList
        roomType={room.type}
        propertyName={propertyName}
        roomName={room.name}
        components={components}
        isProcessing={isProcessing}
        expandedComponents={expandedComponents}
        selectedComponentType={selectedComponentType}
        // Remove availableComponents prop - calculated internally
        onSelectedComponentTypeChange={setSelectedComponentType}
        onAddComponent={handleAddComponent}
        onAddCustomComponent={addCustomComponent}
        onToggleExpand={toggleExpandComponent}
        onRemoveComponent={handleRemoveComponent}
        onToggleEditMode={toggleEditMode}
        onUpdateComponent={handleUpdateComponent}
        onRemoveImage={handleRemoveImage}
        onImagesProcessed={handleImagesProcessed}
        onProcessingStateChange={handleComponentProcessingState}
        componentStaging={Array.from(componentStaging.values())}
        analysisProgress={analysisProgress.get('global') || { status: 'pending', progress: 0 }}
        stagingProcessing={{}} // Convert boolean to object
        onAnalyzeAll={handleAnalyzeAll}
        onClearAllStaging={handleClearAllStaging}
        onAddStagedImages={handleAddStagedImages}
        onRemoveStagedImage={removeStagedImage}
        onProcessStagedComponent={handleProcessStagedComponent}
        onClearComponentStaging={clearComponentStaging}
        onSaveComponent={async (componentId) => console.log('Save component', componentId)}
      />
    </div>
  );
};

export default RoomContent;
