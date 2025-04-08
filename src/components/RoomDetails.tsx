import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Room, RoomSection, RoomComponent } from "@/types";
import { BookCheck, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import RoomSectionEditor from "@/components/RoomSectionEditor";
import RoomComponentInspection from "@/components/RoomComponentInspection";
import RoomImageUploader from "@/components/RoomImageUploader";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoomDetailsProps {
  reportId: string;
  room: Room | null;
  allRooms: Room[];
  currentRoomIndex: number;
  onChangeRoom: (index: number) => void;
  onUpdateGeneralCondition: (roomId: string, condition: string) => Promise<void>;
  onSaveSection: (updatedSection: RoomSection) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
  onImageProcessed: (updatedRoom: Room) => void;
}

const RoomDetails = ({
  reportId,
  room,
  allRooms,
  currentRoomIndex,
  onChangeRoom,
  onUpdateGeneralCondition,
  onSaveSection,
  onUpdateComponents,
  onImageProcessed
}: RoomDetailsProps) => {
  const [activeTab, setActiveTab] = useState("details");

  if (!room) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookCheck className="h-16 w-16 text-shareai-teal mb-4" />
          <h3 className="text-xl font-medium mb-2">No Room Selected</h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Select a room from the list on the left to edit its details or add a new room.
          </p>
        </CardContent>
      </Card>
    );
  }

  const roomsWithContent = allRooms.filter(r => 
    r.components?.some(c => c.description && c.condition) || 
    r.generalCondition
  ).length;
  const overallProgress = Math.round((roomsWithContent / allRooms.length) * 100);

  const requiredComponents = room.components?.filter(c => !c.isOptional) || [];
  const filledRequiredComponents = requiredComponents.filter(c => 
    c.description && c.condition && (c.images.length > 0 || c.notes)
  );
  const roomCompletionPercentage = requiredComponents.length > 0 
    ? Math.round((filledRequiredComponents.length / requiredComponents.length) * 100) 
    : 100;

  const handleComponentUpdate = (updatedComponents: RoomComponent[]) => {
    onUpdateComponents(room.id, updatedComponents);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{room.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentRoomIndex === 0}
                    onClick={() => onChangeRoom(currentRoomIndex - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only md:ml-1">Previous</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to previous room</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <span className="text-sm text-gray-500">
              {currentRoomIndex + 1} of {allRooms.length} rooms
            </span>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentRoomIndex === allRooms.length - 1}
                    onClick={() => onChangeRoom(currentRoomIndex + 1)}
                  >
                    <span className="sr-only md:not-sr-only md:mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to next room</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Room completion</span>
            <span className="text-xs text-gray-500">{roomCompletionPercentage}%</span>
          </div>
          <Progress value={roomCompletionPercentage} className="h-2" />
        </div>
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Overall report progress</span>
            <span className="text-xs text-gray-500">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Room Details</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="photos">Photos & AI Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-2">
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
          </TabsContent>
          
          <TabsContent value="components" className="pt-2">
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
          </TabsContent>
          
          <TabsContent value="photos" className="pt-2">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Room Photos</h3>
              
              {room.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {room.images.map((image) => (
                    <div key={image.id} className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={image.url} 
                        alt={`${room.name}`} 
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={image.aiProcessed ? "bg-green-500" : "bg-yellow-500"}>
                          {image.aiProcessed ? "AI Processed" : "Not Processed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <RoomImageUploader 
                reportId={reportId}
                roomId={room.id}
                onImageProcessed={onImageProcessed}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RoomDetails;
