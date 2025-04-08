
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { RoomType } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";

interface ComponentSelectorProps {
  roomType: RoomType;
  existingComponents: Array<{ type: string }>;
  onAddComponent: (componentType: string) => void;
}

const ComponentSelector = ({ 
  roomType, 
  existingComponents, 
  onAddComponent 
}: ComponentSelectorProps) => {
  const { toast } = useToast();
  const [selectedComponentType, setSelectedComponentType] = useState<string>("");

  const availableComponents = getDefaultComponentsByRoomType(roomType).filter(
    comp => !existingComponents.some(c => c.type === comp.type)
  );

  const handleAddComponent = () => {
    if (!selectedComponentType && availableComponents.length > 0) {
      // If no component is selected but components are available, add the first one
      onAddComponent(availableComponents[0].type);
    } else if (selectedComponentType) {
      // Add the selected component
      onAddComponent(selectedComponentType);
      setSelectedComponentType("");
    } else {
      toast({
        title: "No more components available",
        description: "All possible components for this room type have been added.",
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
      {availableComponents.length > 0 && (
        <div className="w-full sm:w-64">
          <Select 
            value={selectedComponentType} 
            onValueChange={setSelectedComponentType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select component to add" />
            </SelectTrigger>
            <SelectContent>
              {availableComponents.map((comp) => (
                <SelectItem key={comp.type} value={comp.type}>
                  {comp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button 
        onClick={handleAddComponent}
        variant="outline" 
        className="flex items-center gap-1"
        disabled={availableComponents.length === 0}
      >
        <Plus className="h-4 w-4" /> Add Component
      </Button>
    </div>
  );
};

export default ComponentSelector;
