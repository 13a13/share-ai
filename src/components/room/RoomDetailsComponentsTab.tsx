import { Room, RoomComponent } from "@/types";
import RoomComponentInspection from "@/components/RoomComponentInspection";
import { useComponentPersistence } from "@/hooks/report/useComponentPersistence";

interface RoomDetailsComponentsTabProps {
  reportId: string;
  room: Room;
  propertyName?: string;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => void;
}

const RoomDetailsComponentsTab = ({
  reportId,
  room,
  propertyName,
  onUpdateComponents
}: RoomDetailsComponentsTabProps) => {
  console.log(`🏗️ RoomDetailsComponentsTab: propertyName="${propertyName}", roomName="${room.name}"`);
  
  const { updateComponentInDatabase } = useComponentPersistence();
  const handleComponentUpdate = (updatedComponents: RoomComponent[]) => {
    console.log(`🔄 RoomDetailsComponentsTab: Components updated for room ${room.id}:`, updatedComponents);
    onUpdateComponents(room.id, updatedComponents);
  };

  const handleExplicitSave = async (componentId: string) => {
    console.log(`💾 RoomDetailsComponentsTab: Explicit save requested for component ${componentId} in room ${room.id}`);
    
    // Find the component to get its current data
    const component = room.components?.find(c => c.id === componentId);
    if (!component) {
      console.error(`❌ Component ${componentId} not found in room ${room.id}`);
      return;
    }

    // Save the component directly to database
    await updateComponentInDatabase(
      reportId,
      room.id,
      componentId,
      {
        description: component.description,
        conditionSummary: component.conditionSummary,
        condition: component.condition,
        cleanliness: component.cleanliness,
        notes: component.notes,
        conditionPoints: component.conditionPoints
      }
    );
  };

  return (
    <RoomComponentInspection
      reportId={reportId}
      roomId={room.id}
      roomType={room.type}
      propertyName={propertyName}
      roomName={room.name}
      components={room.components || []}
      onChange={handleComponentUpdate}
      onSaveComponent={handleExplicitSave}
    />
  );
};

export default RoomDetailsComponentsTab;