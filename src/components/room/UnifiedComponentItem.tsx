import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RoomComponent, RoomType } from "@/types";
import ComponentHeader from "../component/ComponentHeader";
import ComponentEditForm from "../component/ComponentEditForm";
import ComponentAnalysisSummary from "../component/ComponentAnalysisSummary";
import ComponentImages from "../component/ComponentImages";
import ComponentActions from "../component/ComponentActions";
import MultiImageComponentCapture from "../image-upload/MultiImageComponentCapture";
import ComponentStagingArea from "../component/ComponentStagingArea";
import {
  cleanlinessOptions,
  conditionRatingOptions
} from "@/services/imageProcessingService";

interface UnifiedComponentItemProps {
  component: RoomComponent;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  isExpanded: boolean;
  isProcessing: boolean;
  onToggleExpand: () => void;
  onRemoveComponent: (componentId: string) => void;
  onUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void;
  onToggleEditMode: (componentId: string) => void;
  onRemoveImage: (componentId: string, imageId: string) => void;
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  // Staging area props
  stagedImages?: string[];
  onAddStagedImages?: (componentId: string, images: string[]) => void;
  onRemoveStagedImage?: (componentId: string, imageIndex: number) => void;
  onProcessStagedComponent?: (componentId: string) => Promise<void>;
  onClearComponentStaging?: (componentId: string) => void;
  stagingProcessing?: boolean;
  // Direct save handler
  onSaveComponent: (componentId: string) => Promise<void>;
}

const UnifiedComponentItem = ({
  component,
  roomType,
  propertyName,
  roomName,
  isExpanded,
  isProcessing,
  onToggleExpand,
  onRemoveComponent,
  onUpdateComponent,
  onToggleEditMode,
  onRemoveImage,
  onImagesProcessed,
  onProcessingStateChange,
  stagedImages = [],
  onAddStagedImages,
  onRemoveStagedImage,
  onProcessStagedComponent,
  onClearComponentStaging,
  stagingProcessing = false,
  onSaveComponent
}: UnifiedComponentItemProps) => {
  // Component is expanded if explicitly expanded OR being edited
  const shouldBeExpanded = isExpanded || component.isEditing;

  const hasImages = component.images && component.images.length > 0;
  const hasDescription = Boolean(component.description);
  const hasCondition = Boolean(component.condition);

  console.log(`🔧 UnifiedComponentItem: Rendering component ${component.id} (${component.name})`);
  console.log(`🔧 UnifiedComponentItem: isEditing=${component.isEditing}, hasDescription=${hasDescription}, hasCondition=${hasCondition}`);

  // Wrapper to convert field-based updates to partial component updates
  const handleFieldUpdate = (componentId: string, field: string, value: string | string[]) => {
    onUpdateComponent(componentId, { [field]: value });
  };

  return (
    <Card className="border border-border">
      <Collapsible open={shouldBeExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <ComponentHeader
              name={component.name}
              isOptional={component.isOptional}
              condition={component.condition}
              imagesCount={component.images.length}
            />
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Component Analysis Summary */}
            {(hasDescription || hasCondition) && (
              <ComponentAnalysisSummary
                component={component}
                onEdit={() => onToggleEditMode(component.id)}
              />
            )}

            {/* Component Images */}
            {hasImages && (
              <ComponentImages 
                images={component.images}
                onRemoveImage={(imageId) => onRemoveImage(component.id, imageId)}
              />
            )}

            {/* Image Upload */}
            <MultiImageComponentCapture 
              componentId={component.id}
              componentName={component.name}
              roomType={roomType as RoomType}
              isProcessing={isProcessing}
              currentImages={component.images}
              onImagesProcessed={onImagesProcessed}
              onProcessingStateChange={onProcessingStateChange}
              onRemoveImage={() => {}} // Handled by staging area
            />

            {/* Staging Area */}
            {stagedImages.length > 0 && (
              <ComponentStagingArea
                componentId={component.id}
                componentName={component.name}
                stagedImages={stagedImages}
                isProcessing={stagingProcessing}
                onRemoveStagedImage={onRemoveStagedImage || (() => {})}
                onProcessComponent={onProcessStagedComponent || (() => Promise.resolve())}
                onClearStaging={onClearComponentStaging || (() => {})}
              />
            )}

            {/* Edit Form */}
            {component.isEditing && (
              <ComponentEditForm
                componentId={component.id}
                description={component.description || ''}
                conditionSummary={component.conditionSummary || ''}
                conditionPoints={component.conditionPoints || []}
                condition={component.condition || 'fair'}
                cleanliness={component.cleanliness || ''}
                cleanlinessOptions={cleanlinessOptions}
                conditionRatingOptions={conditionRatingOptions}
                notes={component.notes || ''}
                onUpdateComponent={handleFieldUpdate}
                onToggleEditMode={onToggleEditMode}
                onSaveComponent={onSaveComponent}
              />
            )}

            {/* Component Actions */}
            <ComponentActions
              componentId={component.id}
              isEditing={!!component.isEditing}
              isOptional={component.isOptional}
              onToggleEditMode={onToggleEditMode}
              onRemoveComponent={onRemoveComponent}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default UnifiedComponentItem;