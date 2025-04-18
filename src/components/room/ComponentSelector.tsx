
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
  // Stop propagation on all events to prevent them from bubbling up to parent elements
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
      onClick={handleContainerClick}
    >
      <Select
        value={selectedComponentType}
        onValueChange={onSelectComponent}
      >
        <SelectTrigger 
          className="w-full min-w-[250px]"
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder="Select component to add" />
        </SelectTrigger>
        <SelectContent
          className="z-50 bg-white" // Ensure it has a background and high z-index
          onClick={(e) => e.stopPropagation()}
        >
          {availableComponents.map((comp) => (
            <SelectItem key={comp.type} value={comp.type}>
              {comp.name} {!comp.isOptional && "* (Required)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onAddComponent();
        }}
        disabled={!selectedComponentType}
        className="flex-1 sm:flex-none"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Component
      </Button>
    </div>
  );
};

export default ComponentSelector;
