
import { useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import ComponentImageCapture from "../ComponentImageCapture";
import { RoomComponent, RoomType, ConditionRating } from "@/types";
import ComponentImages from "../component/ComponentImages";
import ComponentEditForm from "../component/ComponentEditForm";
import ComponentActions from "../component/ComponentActions";
import ComponentHeader from "../component/ComponentHeader";

interface ComponentItemProps {
  component: RoomComponent;
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
    imageUrl: string[], 
    result: { 
      description?: string;
      condition?: {
        summary?: string;
        rating?: ConditionRating;
      };
      notes?: string;
    }
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
  const [stagingImages, setStagingImages] = useState<string[]>([]);
  
  const handleComponentImage = (componentId: string, imageUrls: string[], result: any) => {
    onImageProcessed(
      componentId, 
      imageUrls, 
      {
        description: result.description,
        condition: {
          summary: result.condition?.summary,
          rating: result.condition?.rating
        },
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
        <ComponentHeader
          name={component.name}
          isOptional={component.isOptional}
          condition={component.condition}
          imagesCount={component.images.length}
        />
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">
              Photos ({component.images.length}/6)
            </label>
            
            <ComponentImages 
              images={component.images}
              onRemoveImage={(imageId) => onRemoveImage(component.id, imageId)}
            />
            
            <ComponentImageCapture 
              componentId={component.id}
              roomType={roomType}
              componentType={component.type}
              isProcessing={isProcessing}
              currentImages={component.images}
              onImagesProcessed={handleComponentImage}
              onProcessingStateChange={onProcessingStateChange}
              onRemovePreviewImage={(index) => {
                const newStagingImages = [...stagingImages];
                newStagingImages.splice(index, 1);
                setStagingImages(newStagingImages);
              }}
            />
            
            <ComponentActions
              componentId={component.id}
              isEditing={!!component.isEditing}
              isOptional={component.isOptional}
              onToggleEditMode={onToggleEditMode}
              onRemoveComponent={onRemoveComponent}
            />
          </div>
          
          <Collapsible open={component.isEditing} className="space-y-4">
            <CollapsibleContent>
              <ComponentEditForm
                componentId={component.id}
                description={component.description}
                conditionSummary={component.conditionSummary}
                condition={component.condition}
                notes={component.notes}
                onUpdateComponent={onUpdateComponent}
                onToggleEditMode={onToggleEditMode}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ComponentItem;
