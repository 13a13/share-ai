
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface AddCustomComponentProps {
  onAddComponent: (name: string) => void;
  onCancel: () => void;
}

const AddCustomComponent = ({ onAddComponent, onCancel }: AddCustomComponentProps) => {
  const [componentName, setComponentName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (componentName.trim()) {
      onAddComponent(componentName.trim());
      setComponentName("");
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="custom-component-name" className="block text-sm font-medium mb-1">
            Component Name
          </label>
          <Input
            id="custom-component-name"
            placeholder="Enter custom component name..."
            value={componentName}
            onChange={(e) => setComponentName(e.target.value)}
            autoFocus
            required
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button type="submit" disabled={!componentName.trim()}>
            Add Component
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomComponent;
