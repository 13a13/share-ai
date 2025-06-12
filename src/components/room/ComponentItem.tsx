
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
  onProcessingStateChange
}: ComponentItemProps) => {
  // If component is being edited, automatically expand it
  const shouldBeExpanded = isExpanded || component.isEditing;

  const hasImages = component.images && component.images.length > 0;
  const hasDescription = Boolean(component.description);
  const hasCondition = Boolean(component.condition && component.condition !== "fair");

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
                component={component}
                isExpanded={shouldBeExpanded}
                hasImages={hasImages}
                hasDescription={hasDescription}
                hasCondition={hasCondition}
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
                  component={component}
                  onUpdate={onUpdate}
                />
              )}
              
              {/* Analysis Summary */}
              {!component.isEditing && (hasDescription || hasCondition) && (
                <ComponentAnalysisSummary component={component} />
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
                onImagesProcessed={onImageProcessed}
                onProcessingStateChange={onProcessingStateChange}
                onRemoveImage={onRemoveImage}
              />
              
              {/* Actions */}
              <ComponentActions
                component={component}
                onToggleEditMode={onToggleEditMode}
                onRemove={onRemove}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ComponentItem;
