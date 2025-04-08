
import { useState } from "react";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { Room, RoomComponent, RoomSection, RoomType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import RoomComponentInspection from "./RoomComponentInspection";
import RoomSectionEditor from "./RoomSectionEditor";
import { useToast } from "@/components/ui/use-toast";

interface EditableRoomSectionProps {
  reportId: string;
  room: Room;
  onUpdateGeneralCondition: (roomId: string, generalCondition: string) => Promise<void>;
  onSaveSection: (updatedSection: RoomSection) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
}

const EditableRoomSection = ({ 
  reportId, 
  room, 
  onUpdateGeneralCondition, 
  onSaveSection, 
  onUpdateComponents,
  onDeleteRoom
}: EditableRoomSectionProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "components">("details");

  const handleComponentsChange = (updatedComponents: RoomComponent[]) => {
    onUpdateComponents(room.id, updatedComponents);
  };

  const handleDeleteRoom = async () => {
    if (window.confirm(`Are you sure you want to delete ${room.name}?`)) {
      try {
        await onDeleteRoom(room.id);
        toast({
          title: "Room Deleted",
          description: `${room.name} has been deleted from the report.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete room. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3 flex flex-row justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="text-lg flex items-center gap-2">
          {room.name}
          <Badge className="bg-shareai-teal text-white">{room.type.replace('_', ' ')}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => {
            e.stopPropagation();
            handleDeleteRoom();
          }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <Button variant="ghost" size="sm" className="p-0 h-auto">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="px-4 py-3 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <Button 
              variant={activeTab === "details" ? "default" : "ghost"}
              className={activeTab === "details" ? "bg-shareai-teal hover:bg-shareai-teal/90" : ""}
              onClick={() => setActiveTab("details")}
            >
              Room Details
            </Button>
            <Button 
              variant={activeTab === "components" ? "default" : "ghost"}
              className={activeTab === "components" ? "bg-shareai-teal hover:bg-shareai-teal/90" : ""}
              onClick={() => setActiveTab("components")}
            >
              Components
            </Button>
          </div>
          
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">General Condition</label>
                <Textarea 
                  value={room.generalCondition}
                  onChange={(e) => onUpdateGeneralCondition(room.id, e.target.value)}
                  placeholder="Describe the general condition of the room..."
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Room Sections</h3>
                
                {room.sections.map((section) => (
                  <RoomSectionEditor 
                    key={section.id} 
                    section={section}
                    onSave={onSaveSection}
                  />
                ))}
              </div>
            </div>
          )}
          
          {activeTab === "components" && (
            <RoomComponentInspection
              reportId={reportId}
              roomId={room.id}
              roomType={room.type as RoomType}
              components={(room.components || []).map(comp => ({
                ...comp,
                notes: comp.notes,
              }))}
              onChange={handleComponentsChange}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default EditableRoomSection;
