
import { Textarea } from "@/components/ui/textarea";
import { Room } from "@/types";

interface RoomDetailsGeneralTabProps {
  room: Room;
  onUpdateGeneralCondition: (roomId: string, generalCondition: string) => Promise<void>;
  onSaveSection?: (sectionType: string, data: any) => Promise<void>;
}

const RoomDetailsGeneralTab = ({
  room,
  onUpdateGeneralCondition,
  onSaveSection
}: RoomDetailsGeneralTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">General Condition</h3>
        <Textarea 
          value={room.generalCondition || ""}
          onChange={(e) => onUpdateGeneralCondition(room.id, e.target.value)}
          placeholder="Describe the general condition of the room..."
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
};

export default RoomDetailsGeneralTab;
