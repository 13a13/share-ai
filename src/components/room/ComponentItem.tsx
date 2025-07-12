
import { useState } from "react";
import { RoomComponent } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ComponentHeader from "../component/ComponentHeader";
import ComponentEditForm from "../component/ComponentEditForm";
import ComponentAnalysisSummary from "../component/ComponentAnalysisSummary";
import ComponentImages from "../component/ComponentImages";
import ComponentActions from "../component/ComponentActions";
import MultiImageComponentCapture from "../image-upload/MultiImageComponentCapture";
import ComponentStagingArea from "../component/ComponentStagingArea";
import { cleanlinessOptions, conditionRatingOptions } from "@/services/imageProcessingService";

interface ComponentItemProps {
  component: RoomComponent;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  isExpanded: boolean;
  isProcessing: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onToggleEditMode: () => void;
  onUpdate: (updates: Partial<RoomComponent>) => void;
  onRemoveImage: (imageId: string) => void;
  onImageProcessed: (imageUrls: string[], result: any) => void;
  onProcessingStateChange: (isProcessing: boolean) => void;
  
  // New staging props
  stagedImages?: string[];
  onAddStagedImages?: (componentId: string, images: string[]) => void;
  onRemoveStagedImage?: (componentId: string, imageIndex: number) => void;
  onProcessStagedComponent?: (componentId: string) => Promise<void>;
  onClearComponentStaging?: (componentId: string) => void;
  stagingProcessing?: boolean;
}

const ComponentItem = ({
  component,
  roomType,
  propertyName,
  roomName,
  isExpanded,
  isProcessing,
  onToggleExpand,
  onRemove,
  onToggleEditMode,
  onUpdate,
  onRemoveImage,
  onImageProcessed,
  onProcessingStateChange,
  stagedImages,
  onAddStagedImages,
  onRemoveStagedImage,
  onProcessStagedComponent,
  onClearComponentStaging,
  stagingProcessing
}: ComponentItemProps) => {
  // If component is being edited, automatically expand it
  const shouldBeExpanded = isExpanded || component.isEditing;

  const hasImages = component.images && component.images.length > 0;
  const hasDescription = Boolean(component.description);
  const hasCondition = Boolean(component.condition && component.condition !== "fair");

  // Helper function to handle component field updates
  const handleUpdateField = (field: string, value: string | string[]) => {
    onUpdate({ [field]: value });
  };

  // Handle save and cancel for edit form
  const handleSave = () => {
    onToggleEditMode();
  };

  const handleCancel = () => {
    onToggleEditMode();
  };

  return (
    <Card 
      id={`component-${component.id}`}
      className={`component-card transition-all duration-300 ${
        shouldBeExpanded ? 'ring-2 ring-blue-200' : ''
      } ${
        component.isEditing ? 'border-blue-400 bg-blue-50/30' : ''
      }`}
    >
      <Collapsible open={shouldBeExpanded} onOpenChange={onToggleExpand}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer">
              <ComponentHeader
                name={component.name}
                isOptional={component.isOptional}
                condition={component.condition}
                imagesCount={component.images.length}
                isAnalyzed={hasDescription || hasCondition}
                isCustom={component.isOptional && !component.type}
              />
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Edit Form */}
              {component.isEditing && (
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
                  onUpdateField={handleUpdateField}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              )}
              
              {/* Analysis Summary */}
              {!component.isEditing && (hasDescription || hasCondition) && (
                <ComponentAnalysisSummary 
                  component={component}
                  onEdit={onToggleEditMode}
                />
              )}
              
              {/* Images */}
              {hasImages && (
                <ComponentImages
                  images={component.images}
                  onRemoveImage={onRemoveImage}
                />
              )}
              
              {/* Image Capture */}
              <MultiImageComponentCapture
                componentId={component.id}
                componentName={component.name}
                roomType={roomType}
                propertyName={propertyName}
                roomName={roomName}
                isProcessing={isProcessing}
                currentImages={component.images}
                onImagesProcessed={(componentId, imageUrls, result) => onImageProcessed(imageUrls, result)}
                onProcessingStateChange={(componentId, isProcessing) => onProcessingStateChange(isProcessing)}
                onRemoveImage={onRemoveImage}
              />
              
              {/* Component Staging Area */}
              {stagedImages && stagedImages.length > 0 && (
                <ComponentStagingArea
                  componentId={component.id}
                  componentName={component.name}
                  stagedImages={stagedImages}
                  isProcessing={stagingProcessing || false}
                  onRemoveStagedImage={onRemoveStagedImage || (() => {})}
                  onProcessComponent={onProcessStagedComponent || (() => Promise.resolve())}
                  onClearStaging={onClearComponentStaging || (() => {})}
                  disabled={isProcessing}
                />
              )}
              
              {/* Actions */}
              <ComponentActions
                componentId={component.id}
                isEditing={!!component.isEditing}
                isOptional={component.isOptional}
                isAnalyzed={hasDescription || hasCondition}
                onToggleEditMode={onToggleEditMode}
                onRemoveComponent={onRemove}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ComponentItem;
