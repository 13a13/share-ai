
import { RoomType, RoomComponent } from "@/types";
import ComponentHeader from "../component/ComponentHeader";
import ComponentEditForm from "../component/ComponentEditForm";
import ComponentAnalysisSummary from "../component/ComponentAnalysisSummary";
import ComponentImages from "../component/ComponentImages";
import ComponentActions from "../component/ComponentActions";
import MultiImageComponentCapture from "../image-upload/MultiImageComponentCapture";

interface ComponentItemProps {
  component: RoomComponent;
  roomType: RoomType;
  propertyName?: string;
  roomName?: string;
  isExpanded: boolean;
  isProcessing: boolean;
  onToggleExpand: (componentId: string) => void;
  onRemoveComponent: (componentId: string) => void;
  onToggleEditMode: (componentId: string) => void;
  onUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void;
  onRemoveImage: (componentId: string, imageId: string) => void;
  onImageProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
}

const ComponentItem = ({
  component,
  roomType,
  propertyName,
  roomName,
  isExpanded,
  isProcessing,
  onToggleExpand,
  onRemoveComponent,
  onToggleEditMode,
  onUpdateComponent,
  onRemoveImage,
  onImageProcessed,
  onProcessingStateChange
}: ComponentItemProps) => {
  
  console.log(`🔧 ComponentItem "${component.name}" for room "${roomName}" in property "${propertyName}"`);
  
  const componentName = component.name.toLowerCase().replace(/\s+/g, '_');
  
  return (
    <div
      id={`component-${component.id}`}
      className="border rounded-lg p-4 bg-gray-50 transition-colors duration-300"
    >
      <ComponentHeader
        name={component.name}
        isOptional={component.isOptional}
        condition={component.condition}
        imagesCount={component.images.length}
        isAnalyzed={!!component.conditionSummary}
        isCustom={component.isCustom}
      />

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Analysis Summary */}
          {component.conditionSummary && (
            <ComponentAnalysisSummary
              conditionSummary={component.conditionSummary}
              conditionPoints={component.conditionPoints || []}
              condition={component.condition}
              cleanliness={component.cleanliness}
            />
          )}

          {/* Component Images */}
          <ComponentImages
            images={component.images}
            onRemoveImage={(imageId) => onRemoveImage(component.id, imageId)}
          />

          {/* Multi-Image Component Capture with proper folder structure */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              Images will be stored in: {propertyName || 'unknown_property'}/{roomName || 'unknown_room'}/{componentName}
            </p>
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
              onRemoveImage={(imageId) => onRemoveImage(component.id, imageId)}
            />
          </div>

          {/* Edit Form */}
          {component.isEditing && (
            <ComponentEditForm
              componentId={component.id}
              description={component.description}
              conditionSummary={component.conditionSummary}
              conditionPoints={component.conditionPoints || []}
              condition={component.condition}
              cleanliness={component.cleanliness}
              notes={component.notes}
              onUpdateComponent={(updates) => onUpdateComponent(component.id, updates)}
            />
          )}

          {/* Component Actions */}
          <ComponentActions
            componentId={component.id}
            isEditing={!!component.isEditing}
            isOptional={component.isOptional}
            isAnalyzed={!!component.conditionSummary}
            onToggleEditMode={() => onToggleEditMode(component.id)}
            onRemoveComponent={() => onRemoveComponent(component.id)}
          />
        </div>
      )}
    </div>
  );
};

export default ComponentItem;
