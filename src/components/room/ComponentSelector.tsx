
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComponentSelectorProps {
  selectedType: string;
  availableComponents: Array<{ name: string; type: string; isOptional: boolean }>;
  onSelect: (value: string) => void;
}

const ComponentSelector = ({
  selectedType,
  availableComponents,
  onSelect,
}: ComponentSelectorProps) => {
  return (
    <Select
      value={selectedType}
      onValueChange={onSelect}
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
  );
};

export default ComponentSelector;
