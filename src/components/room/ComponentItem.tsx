
import { RoomType, RoomComponent } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import ComponentHeader from "@/components/component/ComponentHeader";
import ComponentEditForm from "@/components/component/ComponentEditForm";
import ComponentAnalysisSummary from "@/components/component/ComponentAnalysisSummary";
import ComponentImages from "@/components/component/ComponentImages";
import ComponentImageCapture from "@/components/ComponentImageCapture";

interface ComponentItemProps {
  component: RoomComponent;
  roomType: RoomType;
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
  console.log(`🔧 ComponentItem: propertyName="${propertyName}", roomName="${roomName}", componentType="${component.type}"`);

  return (
    <Card 
      id={`component-${component.id}`}
      className={`transition-all duration-300 ${isExpanded ? 'shadow-md' : ''}`}
    >
      <ComponentHeader
        name={component.name}
        isOptional={component.isOptional}
        condition={component.condition}
        imagesCount={component.images.length}
        isAnalyzed={!!component.conditionSummary}
        isCustom={!!component.isCustom}
      />
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {component.isEditing ? (
            <ComponentEditForm
              componentId={component.id}
              description={component.description}
              conditionSummary={component.conditionSummary}
              conditionPoints={component.conditionPoints || []}
              condition={component.condition}
              cleanliness={component.cleanliness}
              notes={component.notes}
              onUpdateComponent={(componentId, field, value) => {
                onUpdate({ [field]: value });
              }}
              onToggleEditMode={onToggleEditMode}
            />
          ) : (
            <>
              <ComponentAnalysisSummary
                component={component}
                onEdit={onToggleEditMode}
              />
              
              <ComponentImages
                images={component.images}
                onRemoveImage={onRemoveImage}
              />
              
              <ComponentImageCapture
                componentId={component.id}
                componentType={component.type}
                roomType={roomType}
                propertyName={propertyName}
                roomName={roomName}
                isProcessing={isProcessing}
                currentImages={component.images}
                onImagesProcessed={(componentId, imageUrls, result) => onImageProcessed(imageUrls, result)}
                onProcessingStateChange={(componentId, isProcessing) => onProcessingStateChange(isProcessing)}
                onRemoveImage={onRemoveImage}
              />
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ComponentItem;
