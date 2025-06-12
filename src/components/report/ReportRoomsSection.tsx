
import { Report } from "@/types";
import CollapsibleRoomSection from "@/components/CollapsibleRoomSection";

interface ReportRoomsSectionProps {
  report: Report;
  activeRoomIndex: number;
  onNavigateRoom: (index: number) => void;
}

const ReportRoomsSection = ({ report, activeRoomIndex, onNavigateRoom }: ReportRoomsSectionProps) => {
  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-shareai-blue">Rooms</h2>
      
      {report.rooms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No rooms have been added to this report.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {report.rooms.map((room, index) => (
            <CollapsibleRoomSection 
              key={room.id} 
              room={room} 
              roomIndex={index}
              totalRooms={report.rooms.length}
              onNavigateRoom={onNavigateRoom}
              isComplete={room.components?.filter(c => !c.isOptional).every(c => 
                c.description && c.condition && (c.images.length > 0 || c.notes)
              )}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default ReportRoomsSection;
