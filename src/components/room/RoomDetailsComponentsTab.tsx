
import RoomComponentInspection from "../RoomComponentInspection";
import { Room, RoomComponent } from "@/types";

interface RoomDetailsComponentsTabProps {
  reportId: string;
  room: Room;
  propertyName?: string;
  onUpdateComponents: (roomId: string, components: RoomComponent[]) => void;
}

const RoomDetailsComponentsTab = ({
  reportId,
  room,
  propertyName,
  onUpdateComponents
}: RoomDetailsComponentsTabProps) => {
  
  console.log(`🔧 RoomDetailsComponentsTab for room "${room.name}" in property "${propertyName}"`);
  
  const handleComponentsChange = (updatedComponents: RoomComponent[]) => {
    onUpdateComponents(room.id, updatedComponents);
  };

  return (
    <div className="space-y-4">
      <RoomComponentInspection
        reportId={reportId}
        roomId={room.id}
        roomType={room.type}
        propertyName={propertyName}
        roomName={room.name}
        components={room.components || []}
        onChange={handleComponentsChange}
      />
    </div>
  );
};

export default RoomDetailsComponentsTab;
