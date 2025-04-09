import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Room, RoomComponent, RoomSection, RoomType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import RoomComponentInspection from "./RoomComponentInspection";
import RoomSectionEditor from "./RoomSectionEditor";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";

interface EditableRoomSectionProps {
  reportId: string;
  room: Room;
  roomIndex: number;
  totalRooms: number;
  onNavigateRoom: (index: number) => void;
  onUpdateGeneralCondition: (roomId: string, generalCondition: string) => Promise<void>;
  onSaveSection: (updatedSection: RoomSection) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  isComplete?: boolean;
}

const EditableRoomSection = ({ 
  reportId, 
  room, 
  roomIndex,
  totalRooms,
  onNavigateRoom,
  onUpdateGeneralCondition, 
  onSaveSection, 
  onUpdateComponents,
  onDeleteRoom,
  isComplete = false
}: EditableRoomSectionProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "components">("details");
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate completion percentage for components
  const requiredComponents = room.components?.filter(c => !c.isOptional) || [];
  const filledRequiredComponents = requiredComponents.filter(c => 
    c.description && c.condition && (c.images.length > 0 || c.notes)
  );
  const completionPercentage = requiredComponents.length > 0 
    ? Math.round((filledRequiredComponents.length / requiredComponents.length) * 100) 
    : 100;

  useEffect(() => {
    // Only scroll to room if explicitly navigated to
    if (isExpanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isExpanded]);

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
    <Card 
      ref={cardRef}
      className={`mb-4 transition-all duration-300 ${isComplete ? 'border-green-400' : ''}`}
    >
      <CardHeader 
        className="py-3 flex flex-row justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col">
          <CardTitle className="text-lg flex items-center gap-2">
            {room.name}
            <Badge className="bg-shareai-teal text-white">{room.type.replace('_', ' ')}</Badge>
            {isComplete && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className="bg-green-500">Complete</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">This room has all required components documented</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          <div className="mt-2 w-full">
            <div className="flex items-center gap-2">
              <Progress value={completionPercentage} className="h-2" />
              <span className="text-xs text-gray-500">{completionPercentage}%</span>
            </div>
          </div>
        </div>
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
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default EditableRoomSection;
