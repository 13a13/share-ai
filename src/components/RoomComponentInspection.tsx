
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Camera, Plus, Edit } from "lucide-react";
import { ConditionRating, RoomType } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { GeminiAPI } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  description: string;
  condition: ConditionRating;
  notes: string;
  images: {
    id: string;
    url: string;
    timestamp: Date;
  }[];
  isOptional?: boolean; // Can this component be removed
  isEditing?: boolean; // Is the component currently being edited
}

interface RoomComponentInspectionProps {
  reportId: string;
  roomId: string;
  roomType: RoomType;
  components: ComponentItem[];
  onChange: (updatedComponents: ComponentItem[]) => void;
}

const conditionOptions: { value: ConditionRating; label: string; color: string }[] = [
  { value: "excellent", label: "Excellent", color: "bg-green-500" },
  { value: "good", label: "Good", color: "bg-blue-500" },
  { value: "fair", label: "Fair", color: "bg-yellow-500" },
  { value: "poor", label: "Poor", color: "bg-orange-500" },
  { value: "needs_replacement", label: "Needs Replacement", color: "bg-red-500" },
];

const standardRoomComponents = [
  { name: "Walls", type: "walls", isOptional: false },
  { name: "Ceiling", type: "ceiling", isOptional: false },
  { name: "Flooring", type: "flooring", isOptional: false },
  { name: "Doors & Frames", type: "doors", isOptional: false },
  { name: "Windows & Frames", type: "windows", isOptional: true },
  { name: "Lighting & Electrical", type: "lighting", isOptional: true },
  { name: "Furniture & Storage", type: "furniture", isOptional: true },
];

const bathroomComponents = [
  ...standardRoomComponents,
  { name: "Bath/Shower", type: "bath", isOptional: false },
  { name: "Vanity/Sink", type: "vanity", isOptional: true },
  { name: "Toilet", type: "toilet", isOptional: false },
  { name: "Mirror", type: "mirror", isOptional: true },
];

const kitchenComponents = [
  ...standardRoomComponents,
  { name: "Cabinetry & Countertops", type: "cabinetry", isOptional: false },
  { name: "Sink & Taps", type: "sink", isOptional: false },
  { name: "Refrigerator", type: "refrigerator", isOptional: true },
  { name: "Oven/Stove", type: "oven", isOptional: true },
  { name: "Dishwasher", type: "dishwasher", isOptional: true },
  { name: "Microwave", type: "microwave", isOptional: true },
];

const getDefaultComponentsByRoomType = (roomType: RoomType): { name: string; type: string; isOptional: boolean }[] => {
  switch (roomType) {
    case "bathroom":
      return bathroomComponents;
    case "kitchen":
      return kitchenComponents;
    default:
      return standardRoomComponents;
  }
};

const RoomComponentInspection = ({ 
  reportId, 
  roomId, 
  roomType, 
  components, 
  onChange 
}: RoomComponentInspectionProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);

  const handleImageCapture = async (componentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      if (!e.target?.result) return;
      
      const imageUrl = e.target.result as string;
      setIsProcessing((prev) => ({ ...prev, [componentId]: true }));
      
      try {
        // Find the component
        const component = components.find(c => c.id === componentId);
        
        if (!component) {
          throw new Error("Component not found");
        }
        
        // Process image with the Gemini API using component type
        const response = await fetch(`${window.location.origin}/supabase-functions/process-room-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl,
            roomType,
            componentType: component.type
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to process image: ${errorText}`);
        }
        
        const result = await response.json();
        
        // Generate a unique ID for the image
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Update the component with the results from Gemini
        const updatedComponents = components.map(comp => {
          if (comp.id === componentId) {
            return {
              ...comp,
              description: result.description || comp.description,
              condition: result.condition || comp.condition,
              notes: result.notes ? (comp.notes ? `${comp.notes}\n\nAI Suggested: ${result.notes}` : result.notes) : comp.notes,
              images: [
                ...comp.images,
                {
                  id: imageId,
                  url: imageUrl,
                  timestamp: new Date(),
                }
              ],
              isEditing: true // Automatically open the editing panel
            };
          }
          return comp;
        });
        
        // Call the parent's onChange function
        onChange(updatedComponents);
        
        // Open the component's accordion
        if (!expandedComponents.includes(componentId)) {
          setExpandedComponents([...expandedComponents, componentId]);
        }
        
        toast({
          title: "Image processed successfully",
          description: `AI has analyzed the ${component.name} image`,
        });
      } catch (error) {
        console.error("Error processing image:", error);
        toast({
          title: "Error processing image",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsProcessing((prev) => ({ ...prev, [componentId]: false }));
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleAddComponent = () => {
    // Get available components for this room type that aren't already added
    const availableComponents = getDefaultComponentsByRoomType(roomType).filter(
      comp => !components.some(c => c.type === comp.type)
    );
    
    if (availableComponents.length === 0) {
      toast({
        title: "No more components available",
        description: "All possible components for this room type have been added.",
      });
      return;
    }
    
    // Add the first available component
    const newComponent = availableComponents[0];
    const newComponentId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updatedComponents = [
      ...components,
      {
        id: newComponentId,
        name: newComponent.name,
        type: newComponent.type,
        description: "",
        condition: "fair",
        notes: "",
        images: [],
        isOptional: newComponent.isOptional,
        isEditing: true,
      }
    ];
    
    onChange(updatedComponents);
    
    // Open the new component's accordion
    setExpandedComponents([...expandedComponents, newComponentId]);
    
    toast({
      title: "Component added",
      description: `${newComponent.name} has been added to the room inspection.`,
    });
  };

  const handleRemoveComponent = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    
    if (!component) return;
    
    // Check if component is optional
    if (!component.isOptional) {
      toast({
        title: "Cannot remove component",
        description: `${component.name} is a required component for this room type.`,
        variant: "destructive",
      });
      return;
    }
    
    const updatedComponents = components.filter(c => c.id !== componentId);
    onChange(updatedComponents);
    
    // Remove from expanded components
    setExpandedComponents(expandedComponents.filter(id => id !== componentId));
    
    toast({
      title: "Component removed",
      description: `${component.name} has been removed from the room inspection.`,
    });
  };

  const handleUpdateComponent = (componentId: string, field: string, value: string) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          [field]: value,
        };
      }
      return comp;
    });
    
    onChange(updatedComponents);
  };

  const toggleEditMode = (componentId: string) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          isEditing: !comp.isEditing,
        };
      }
      return comp;
    });
    
    onChange(updatedComponents);
  };

  const handleRemoveImage = (componentId: string, imageId: string) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          images: comp.images.filter(img => img.id !== imageId),
        };
      }
      return comp;
    });
    
    onChange(updatedComponents);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Room Components</h3>
        <Button 
          onClick={handleAddComponent}
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add Component
        </Button>
      </div>
      
      {components.length === 0 ? (
        <Card className="border-dashed border-2 p-6">
          <div className="text-center text-gray-500">
            <p>No components added yet.</p>
            <Button 
              onClick={handleAddComponent} 
              variant="outline" 
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" /> Add First Component
            </Button>
          </div>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          value={expandedComponents}
          onValueChange={setExpandedComponents}
          className="space-y-4"
        >
          {components.map((component) => (
            <AccordionItem 
              key={component.id} 
              value={component.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span>{component.name}</span>
                  {component.condition && (
                    <Badge className={
                      conditionOptions.find(opt => opt.value === component.condition)?.color || 
                      "bg-gray-500"
                    }>
                      {conditionOptions.find(opt => opt.value === component.condition)?.label || component.condition}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2">
                <div className="space-y-4">
                  {/* Image Upload/Capture Section */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">
                      Photos ({component.images.length})
                    </label>
                    
                    {component.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                        {component.images.map((image) => (
                          <div key={image.id} className="relative group border rounded overflow-hidden">
                            <img 
                              src={image.url} 
                              alt={component.name} 
                              className="w-full h-32 object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(component.id, image.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex">
                      <div className="relative">
                        <input
                          type="file" 
                          id={`image-upload-${component.id}`} 
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleImageCapture(component.id, e)}
                          disabled={isProcessing[component.id]}
                        />
                        <label 
                          htmlFor={`image-upload-${component.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-shareai-teal hover:bg-shareai-teal/90 cursor-pointer"
                        >
                          {isProcessing[component.id] ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Camera className="h-4 w-4 mr-2" />
                              Upload Photo
                            </div>
                          )}
                        </label>
                      </div>
                      
                      {!component.isEditing && (
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() => toggleEditMode(component.id)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </Button>
                      )}
                      
                      {component.isOptional && (
                        <Button
                          variant="outline"
                          className="ml-auto text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveComponent(component.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Collapsible Edit Section */}
                  <Collapsible open={component.isEditing} className="space-y-4">
                    <CollapsibleContent>
                      <div className="space-y-4 pt-2">
                        {/* Description Field */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Description
                          </label>
                          <Textarea
                            value={component.description}
                            onChange={(e) => handleUpdateComponent(component.id, "description", e.target.value)}
                            placeholder="Describe the current condition, appearance, etc."
                            className="w-full"
                            rows={3}
                          />
                        </div>
                        
                        {/* Condition Field */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Condition
                          </label>
                          <Select
                            value={component.condition}
                            onValueChange={(value) => handleUpdateComponent(component.id, "condition", value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                              {conditionOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center">
                                    <span className={`h-2 w-2 rounded-full ${option.color} mr-2`}></span>
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Notes Field */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Additional Notes
                          </label>
                          <Textarea
                            value={component.notes}
                            onChange={(e) => handleUpdateComponent(component.id, "notes", e.target.value)}
                            placeholder="Add any additional notes or observations"
                            className="w-full"
                            rows={3}
                          />
                        </div>
                        
                        {/* Done Button */}
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => toggleEditMode(component.id)}
                            className="bg-shareai-teal hover:bg-shareai-teal/90"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default RoomComponentInspection;
