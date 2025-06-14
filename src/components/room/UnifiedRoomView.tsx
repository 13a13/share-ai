
import { useState } from "react";
import { Room, RoomComponent } from "@/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomHeader from "./RoomHeader";
import RoomDetailsGeneralTab from "./RoomDetailsGeneralTab";
import RoomDetailsComponentsTab from "./RoomDetailsComponentsTab";
import RoomDetailsPhotosTab from "./RoomDetailsPhotosTab";

interface UnifiedRoomViewProps {
  reportId: string;
  room: Room;
  roomIndex: number;
  totalRooms: number;
  propertyName?: string;
  onNavigateRoom: (direction: 'prev' | 'next') => void;
  onUpdateGeneralCondition: (roomId: string, generalCondition: string) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  isComplete?: boolean;
}

const UnifiedRoomView = ({
  reportId,
  room,
  roomIndex,
  totalRooms,
  propertyName,
  onNavigateRoom,
  onUpdateGeneralCondition,
  onUpdateComponents,
  onDeleteRoom,
  isComplete = false
}: UnifiedRoomViewProps) => {
  const [activeTab, setActiveTab] = useState("general");

  console.log(`🏠 UnifiedRoomView: propertyName="${propertyName}", roomName="${room.name}"`);

  const handleImageProcessed = (updatedRoom: Room) => {
    // This could trigger a parent update if needed
    console.log("Room image processed:", updatedRoom);
  };

  return (
    <Card className="w-full">
      <RoomHeader
        room={room}
        roomIndex={roomIndex}
        totalRooms={totalRooms}
        isComplete={isComplete}
        onNavigateRoom={onNavigateRoom}
        onDeleteRoom={() => onDeleteRoom(room.id)}
      />
      
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <RoomDetailsGeneralTab
              room={room}
              onUpdateGeneralCondition={onUpdateGeneralCondition}
            />
          </TabsContent>
          
          <TabsContent value="components" className="mt-6">
            <RoomDetailsComponentsTab
              reportId={reportId}
              room={room}
              propertyName={propertyName}
              onUpdateComponents={onUpdateComponents}
            />
          </TabsContent>
          
          <TabsContent value="photos" className="mt-6">
            <RoomDetailsPhotosTab
              reportId={reportId}
              room={room}
              propertyName={propertyName}
              onImageProcessed={handleImageProcessed}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default UnifiedRoomView;
