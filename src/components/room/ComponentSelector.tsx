
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  onAddComponent,
}: ComponentSelectorProps) => {
  const handleAddClick = () => {
    console.log("Add component button clicked", { selectedComponentType });
    onAddComponent();
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Select
        value={selectedComponentType}
        onValueChange={onSelectComponent}
      >
        <SelectTrigger className="w-full min-w-[250px]">
          <SelectValue placeholder="Select component to add" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-white">
          {availableComponents.map((comp) => (
            <SelectItem key={comp.type} value={comp.name}>
              {comp.name} {!comp.isOptional && "* (Required)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={handleAddClick}
        disabled={!selectedComponentType}
        className="flex-1 sm:flex-none"
        type="button"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Component
      </Button>
    </div>
  );
};

export default ComponentSelector;
