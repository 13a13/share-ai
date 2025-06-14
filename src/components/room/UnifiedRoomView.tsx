
import { useState } from "react";
import { Room, RoomComponent } from "@/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomHeader from "./RoomHeader";
import RoomDetailsGeneralTab from "./RoomDetailsGeneralTab";
import RoomDetailsComponentsTab from "./RoomDetailsComponentsTab";
import RoomDetailsPhotosTab from "./RoomDetailsPhotosTab";
import { calculateRoomCompletion } from "@/utils/roomCompletionUtils";

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
  const [isExpanded, setIsExpanded] = useState(true);

  console.log(`🏠 UnifiedRoomView: propertyName="${propertyName}", roomName="${room.name}"`);

  const handleImageProcessed = (updatedRoom: Room) => {
    // This could trigger a parent update if needed
    console.log("Room image processed:", updatedRoom);
  };

  // Convert the direction-based navigation to index-based for RoomHeader
  const handleRoomNavigation = (index: number) => {
    const currentIndex = roomIndex;
    if (index < currentIndex) {
      onNavigateRoom('prev');
    } else if (index > currentIndex) {
      onNavigateRoom('next');
    }
  };

  // Calculate completion percentage
  const { completionPercentage } = calculateRoomCompletion(room);

  return (
    <Card className="w-full">
      <RoomHeader
        room={room}
        roomIndex={roomIndex}
        totalRooms={totalRooms}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        completionPercentage={completionPercentage}
        isComplete={isComplete}
        onNavigateRoom={handleRoomNavigation}
        onDeleteRoom={() => onDeleteRoom(room.id)}
      />
      
      {isExpanded && (
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
                onSaveSection={async (sectionType, data) => {
                  console.log(`Saving section ${sectionType}:`, data);
                }}
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
      )}
    </Card>
  );
};

export default UnifiedRoomView;
