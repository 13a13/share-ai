
import { Room, RoomComponent } from "@/types";
import RoomComponentInspection from "@/components/RoomComponentInspection";

interface RoomDetailsComponentsTabProps {
  reportId: string;
  room: Room;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
}

const RoomDetailsComponentsTab = ({
  reportId,
  room,
  onUpdateComponents
}: RoomDetailsComponentsTabProps) => {
  const handleComponentUpdate = (updatedComponents: RoomComponent[]) => {
    onUpdateComponents(room.id, updatedComponents);
  };

  return (
    <RoomComponentInspection
      reportId={reportId}
      roomId={room.id}
      roomType={room.type}
      components={(room.components || []).map(comp => ({
        ...comp,
        notes: comp.notes,
      }))}
      onChange={handleComponentUpdate}
    />
  );
};

export default RoomDetailsComponentsTab;
