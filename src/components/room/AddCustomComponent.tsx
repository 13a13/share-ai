
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { commonComponentTypes } from "@/utils/roomComponentUtils";

interface AddCustomComponentProps {
  onAddComponent: (name: string, type: string) => void;
}

const AddCustomComponent = ({ onAddComponent }: AddCustomComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [componentType, setComponentType] = useState("other");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (componentName.trim()) {
      onAddComponent(componentName.trim(), componentType);
      setComponentName("");
      setIsExpanded(false);
    }
  };

  return (
    <div className="my-4">
      {!isExpanded ? (
        <Button 
          variant="outline" 
          className="w-full border-dashed border-2 flex items-center justify-center py-6 text-gray-500 hover:text-gray-700 hover:border-gray-400"
          onClick={() => setIsExpanded(true)}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Custom Component
        </Button>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="component-name">Component Name <span className="text-red-500">*</span></Label>
                <Input
                  id="component-name"
                  placeholder="Enter component name (e.g., Ceiling Fan, Curtains - West Wall)"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="component-type">Component Type (Optional)</Label>
                <Select value={componentType} onValueChange={setComponentType}>
                  <SelectTrigger id="component-type">
                    <SelectValue placeholder="Select component type" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonComponentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Selecting a type helps with organization but doesn't limit what you can name the component.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsExpanded(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-shareai-teal hover:bg-shareai-teal/90">
                  Add Component
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddCustomComponent;
