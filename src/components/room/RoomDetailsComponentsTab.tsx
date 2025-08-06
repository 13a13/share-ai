import { Room, RoomComponent } from "@/types";
import RoomComponentInspection from "@/components/RoomComponentInspection";
import { useUnifiedRoomManagement } from "@/hooks/report/useUnifiedRoomManagement";

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
  
  // Use the unified room management hook for direct saving
  const { handleSaveComponent } = useUnifiedRoomManagement(null, () => {});

  const handleComponentUpdate = (updatedComponents: RoomComponent[]) => {
    console.log(`🔄 RoomDetailsComponentsTab: Components updated for room ${room.id}:`, updatedComponents);
    onUpdateComponents(room.id, updatedComponents);
  };

  const handleExplicitSave = async (componentId: string) => {
    console.log(`💾 RoomDetailsComponentsTab: Explicit save requested for component ${componentId} in room ${room.id}`);
    await handleSaveComponent(room.id, componentId);
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