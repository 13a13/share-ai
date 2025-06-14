
import { useState } from "react";
import { Room } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomDetailsGeneralTab from "./RoomDetailsGeneralTab";
import RoomDetailsComponentsTab from "./RoomDetailsComponentsTab";
import RoomDetailsPhotosTab from "./RoomDetailsPhotosTab";

interface RoomContentProps {
  reportId: string;
  room: Room;
  propertyName?: string;
  onUpdateGeneralCondition: (roomId: string, condition: string, summary: string) => void;
  onUpdateComponents: (roomId: string, components: any[]) => void;
}

const RoomContent = ({
  reportId,
  room,
  propertyName,
  onUpdateGeneralCondition,
  onUpdateComponents
}: RoomContentProps) => {
  const [activeTab, setActiveTab] = useState("general");

  console.log(`📋 RoomContent for room "${room.name}" in property "${propertyName}"`);

  const handleImageProcessed = (updatedRoom: Room) => {
    // Handle room image processing if needed
    console.log("Room image processed:", updatedRoom);
  };

  const handleGeneralConditionUpdate = async (roomId: string, condition: string) => {
    // Call the original function with an empty summary since it expects 3 parameters
    onUpdateGeneralCondition(roomId, condition, "");
  };

  const handleSaveSection = async (section: any) => {
    // Handle section saving
    console.log("Saving section:", section);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="components">Components</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-4">
        <RoomDetailsGeneralTab
          room={room}
          onUpdateGeneralCondition={handleGeneralConditionUpdate}
          onSaveSection={handleSaveSection}
        />
      </TabsContent>

      <TabsContent value="components" className="mt-4">
        <RoomDetailsComponentsTab
          reportId={reportId}
          room={room}
          propertyName={propertyName}
          onUpdateComponents={onUpdateComponents}
        />
      </TabsContent>

      <TabsContent value="photos" className="mt-4">
        <RoomDetailsPhotosTab
          reportId={reportId}
          room={room}
          propertyName={propertyName}
          onImageProcessed={handleImageProcessed}
        />
      </TabsContent>
    </Tabs>
  );
};

export default RoomContent;
