
import { useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { RoomComponent, RoomType, ConditionRating } from "@/types";
import ComponentImages from "../component/ComponentImages";
import ComponentEditForm from "../component/ComponentEditForm";
import ComponentActions from "../component/ComponentActions";
import ComponentHeader from "../component/ComponentHeader";
import MultiImageComponentCapture from "../MultiImageComponentCapture";
import {
  cleanlinessOptions,
  conditionRatingOptions
} from "@/services/imageProcessingService";

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
    imageUrls: string[], 
    result: { 
      description?: string; 
      condition?: {
        summary?: string;
        points?: string[];
        rating?: ConditionRating;
      };
      cleanliness?: string;
      rating?: string;
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
  
  const handleComponentImages = (componentId: string, imageUrls: string[], result: any) => {
    // Map cleanliness value to standard format if provided
    let standardizedCleanliness = result.cleanliness;
    if (standardizedCleanliness) {
      // Convert from "Professional Clean" to "professional_clean" format
      standardizedCleanliness = standardizedCleanliness
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    }
    
    onImageProcessed(
      componentId, 
      imageUrls, 
      {
        description: result.description,
        condition: {
          summary: result.condition?.summary,
          points: result.condition?.points || [],
          rating: result.condition?.rating
        },
        cleanliness: standardizedCleanliness || "domestic_clean",
        notes: result.notes
      }
    );
  };

  const handleRemoveStagingImage = (index: number) => {
    console.log("Remove staging image at index", index);
    // This is handled in the MultiImageComponentCapture component
  };
  
  // Render component details if there's any meaningful content
  const hasDetails = component.description || 
                     component.conditionSummary || 
                     (component.conditionPoints && component.conditionPoints.length > 0) || 
                     component.notes;

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
              Photos ({component.images.length}/20)
            </label>
            
            <ComponentImages 
              images={component.images}
              onRemoveImage={(imageId) => onRemoveImage(component.id, imageId)}
            />
            
            <MultiImageComponentCapture 
              componentId={component.id}
              componentName={component.name}
              roomType={roomType}
              isProcessing={isProcessing}
              currentImages={component.images}
              onImagesProcessed={handleComponentImages}
              onProcessingStateChange={onProcessingStateChange}
              onRemoveImage={handleRemoveStagingImage}
            />
            
            {/* Display component details summary when not editing */}
            {hasDetails && !component.isEditing && (
              <div className="border rounded-md p-3 mt-2 bg-gray-50 space-y-2">
                {component.description && (
                  <div>
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm">{component.description}</p>
                  </div>
                )}
                
                {component.conditionSummary && (
                  <div>
                    <h4 className="text-sm font-medium">Condition Summary</h4>
                    <p className="text-sm">{component.conditionSummary}</p>
                  </div>
                )}
                
                {component.conditionPoints && component.conditionPoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium">Condition Details</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {component.conditionPoints.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {component.notes && (
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="text-sm italic">{component.notes}</p>
                  </div>
                )}
              </div>
            )}
            
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
                conditionPoints={component.conditionPoints || []}
                condition={component.condition}
                cleanliness={component.cleanliness}
                cleanlinessOptions={cleanlinessOptions}
                conditionRatingOptions={conditionRatingOptions}
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
