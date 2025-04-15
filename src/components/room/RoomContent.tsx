
import { Textarea } from "@/components/ui/textarea";
import { Room, RoomComponent } from "@/types";
import { useRoomComponents } from "@/hooks/useRoomComponents";
import ComponentList from "./ComponentList";

interface RoomContentProps {
  reportId: string;
  room: Room;
  onUpdateGeneralCondition: (roomId: string, generalCondition: string) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
}

const RoomContent = ({
  reportId,
  room,
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
    toggleExpandComponent
  } = useRoomComponents({
    roomId: room.id,
    roomType: room.type,
    initialComponents: room.components || [],
    onChange: (updatedComponents) => onUpdateComponents(room.id, updatedComponents)
  });

  return (
    <div className="px-4 py-3 space-y-4">
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
        components={components}
        isProcessing={isProcessing}
        expandedComponents={expandedComponents}
        selectedComponentType={selectedComponentType}
        availableComponents={availableComponents}
        onSelectComponent={setSelectedComponentType}
        onAddComponent={handleAddComponent}
        onAddCustomComponent={addCustomComponent}
        onToggleExpand={toggleExpandComponent}
        onRemoveComponent={handleRemoveComponent}
        onToggleEditMode={toggleEditMode}
        onUpdateComponent={handleUpdateComponent}
        onRemoveImage={handleRemoveImage}
        onImageProcessed={handleImagesProcessed}
        onProcessingStateChange={handleComponentProcessingState}
      />
    </div>
  );
};

export default RoomContent;
