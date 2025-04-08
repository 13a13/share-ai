
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ComponentSelectorProps {
  selectedComponentType: string;
  availableComponents: Array<{ name: string; type: string; isOptional: boolean }>;
  onSelectComponent: (value: string) => void;
  onAddComponent: () => void;
}

const ComponentSelector = ({
  selectedComponentType,
  availableComponents,
  onSelectComponent,
  onAddComponent
}: ComponentSelectorProps) => {
  return (
    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
      {availableComponents.length > 0 && (
        <div className="w-full sm:w-64">
          <Select 
            value={selectedComponentType} 
            onValueChange={onSelectComponent}
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
        onClick={onAddComponent}
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
