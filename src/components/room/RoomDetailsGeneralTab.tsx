
import { Textarea } from "@/components/ui/textarea";
import { Room, RoomSection } from "@/types";
import RoomSectionEditor from "@/components/RoomSectionEditor";

interface RoomDetailsGeneralTabProps {
  room: Room;
  onUpdateGeneralCondition: (roomId: string, condition: string) => Promise<void>;
  onSaveSection: (updatedSection: RoomSection) => Promise<void>;
}

const RoomDetailsGeneralTab = ({
  room,
  onUpdateGeneralCondition,
  onSaveSection
}: RoomDetailsGeneralTabProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">General Condition</h3>
        <Textarea 
          value={room.generalCondition}
          onChange={(e) => onUpdateGeneralCondition(room.id, e.target.value)}
          placeholder="Describe the general condition of the room..."
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Detailed Sections</h3>
        
        {room.sections.map((section) => (
          <RoomSectionEditor 
            key={section.id} 
            section={section}
            onSave={onSaveSection}
          />
        ))}
      </div>
    </div>
  );
};

export default RoomDetailsGeneralTab;
