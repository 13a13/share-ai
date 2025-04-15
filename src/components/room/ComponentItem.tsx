import { useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { RoomComponent, RoomType, ConditionRating } from "@/types";
import ComponentImages from "../component/ComponentImages";
import ComponentEditForm from "../component/ComponentEditForm";
import ComponentActions from "../component/ComponentActions";
import ComponentHeader from "../component/ComponentHeader";
import MultiImageComponentCapture from "../image-upload/MultiImageComponentCapture";
import ComponentAnalysisSummary from "../component/ComponentAnalysisSummary";
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
                     
  // Determine if this component has been analyzed by Gemini
  const isAnalyzed = hasDetails && component.images.length > 0;
  
  // Get the last image timestamp if available to show last analyzed time
  const lastImageTimestamp = component.images.length > 0 
    ? component.images.reduce((latest, img) => 
        img.timestamp && new Date(img.timestamp) > new Date(latest) ? img.timestamp : latest, 
        component.images[0].timestamp || new Date().toISOString()
      )
    : null;

  return (
    <AccordionItem 
      value={component.id}
      id={`component-${component.id}`}
      className={`border rounded-lg overflow-hidden transition-all duration-300 ${isAnalyzed ? 'border-shareai-teal/40' : ''}`}
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
          isAnalyzed={isAnalyzed}
        />
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Photos ({component.images.length}/20)
              </label>
              {lastImageTimestamp && (
                <span className="text-xs text-gray-500">
                  Last analyzed: {new Date(lastImageTimestamp).toLocaleDateString()} at {new Date(lastImageTimestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            
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
              disabled={isProcessing}
            />
            
            {/* Display component details summary when not editing */}
            {hasDetails && !component.isEditing && (
              <ComponentAnalysisSummary
                component={component}
                onEdit={() => onToggleEditMode(component.id)}
              />
            )}
            
            <ComponentActions
              componentId={component.id}
              isEditing={!!component.isEditing}
              isOptional={component.isOptional}
              isAnalyzed={isAnalyzed}
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
