
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Room, RoomSection, RoomComponent } from "@/types";
import RoomDetailsGeneralTab from "./RoomDetailsGeneralTab";
import RoomDetailsComponentsTab from "./RoomDetailsComponentsTab";
import RoomDetailsPhotosTab from "./RoomDetailsPhotosTab";

interface RoomDetailsContentProps {
  reportId: string;
  room: Room;
  onUpdateGeneralCondition: (roomId: string, condition: string) => Promise<void>;
  onSaveSection: (updatedSection: RoomSection) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
  onImageProcessed: (updatedRoom: Room) => void;
}

const RoomDetailsContent = ({
  reportId,
  room,
  onUpdateGeneralCondition,
  onSaveSection,
  onUpdateComponents,
  onImageProcessed
}: RoomDetailsContentProps) => {
  const [activeTab, setActiveTab] = useState("details");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="details">Room Details</TabsTrigger>
        <TabsTrigger value="components">Components</TabsTrigger>
        <TabsTrigger value="photos">Photos & AI Analysis</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="pt-2 animate-none">
        <RoomDetailsGeneralTab
          room={room}
          onUpdateGeneralCondition={onUpdateGeneralCondition}
          onSaveSection={onSaveSection}
        />
      </TabsContent>
      
      <TabsContent value="components" className="pt-2 animate-none">
        <RoomDetailsComponentsTab
          reportId={reportId}
          room={room}
          onUpdateComponents={onUpdateComponents}
        />
      </TabsContent>
      
      <TabsContent value="photos" className="pt-2 animate-none">
        <RoomDetailsPhotosTab
          reportId={reportId}
          room={room}
          onImageProcessed={onImageProcessed}
        />
      </TabsContent>
    </Tabs>
  );
};

export default RoomDetailsContent;
