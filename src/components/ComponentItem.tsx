
import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import ComponentImageCapture from "./ComponentImageCapture";
import { conditionOptions } from "@/utils/roomComponentUtils";
import { RoomComponent, RoomType, ConditionRating } from "@/types";

interface ComponentItemProps {
  component: RoomComponent & { isEditing?: boolean };
  roomType: RoomType;
  expanded: boolean;
  isProcessing: boolean;
  onToggleExpand: (componentId: string) => void;
  onRemoveComponent: (componentId: string) => void;
  onToggleEditMode: (componentId: string) => void;
  onUpdateComponent: (componentId: string, field: string, value: string) => void;
  onRemoveImage: (componentId: string, imageId: string) => void;
  onImageProcessed: (
    componentId: string, 
    imageUrl: string, 
    result: { description?: string; condition?: ConditionRating; notes?: string }
  ) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
}

const ComponentItem = ({
  component,
  roomType,
  expanded,
  isProcessing,
  onToggleExpand,
  onRemoveComponent,
  onToggleEditMode,
  onUpdateComponent,
  onRemoveImage,
  onImageProcessed,
  onProcessingStateChange
}: ComponentItemProps) => {
  
  const handleComponentImage = (componentId: string, imageUrl: string, result: any) => {
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    onImageProcessed(
      componentId, 
      imageUrl, 
      {
        description: result.description,
        condition: result.condition,
        notes: result.notes
      }
    );
  };

  return (
    <AccordionItem 
      value={component.id}
      className="border rounded-lg overflow-hidden"
    >
      <AccordionTrigger 
        className="px-4 py-2 hover:no-underline"
        onClick={() => onToggleExpand(component.id)}
      >
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
                      onClick={() => onRemoveImage(component.id, image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex">
              <ComponentImageCapture 
                componentId={component.id}
                roomType={roomType}
                componentType={component.type}
                isProcessing={isProcessing}
                onImageProcessed={handleComponentImage}
                onProcessingStateChange={onProcessingStateChange}
              />
              
              {!component.isEditing && (
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() => onToggleEditMode(component.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              )}
              
              {component.isOptional && (
                <Button
                  variant="outline"
                  className="ml-auto text-red-500 hover:text-red-700"
                  onClick={() => onRemoveComponent(component.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
          
          <Collapsible open={component.isEditing} className="space-y-4">
            <CollapsibleContent>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    value={component.description}
                    onChange={(e) => onUpdateComponent(component.id, "description", e.target.value)}
                    placeholder="Describe the current condition, appearance, etc."
                    className="w-full"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Condition
                  </label>
                  <Select
                    value={component.condition}
                    onValueChange={(value) => onUpdateComponent(component.id, "condition", value)}
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
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Additional Notes
                  </label>
                  <Textarea
                    value={component.notes}
                    onChange={(e) => onUpdateComponent(component.id, "notes", e.target.value)}
                    placeholder="Add any additional notes or observations"
                    className="w-full"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => onToggleEditMode(component.id)}
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
  );
};

export default ComponentItem;
