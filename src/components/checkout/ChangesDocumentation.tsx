
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import MultiImageComponentCapture from '@/components/image-upload/MultiImageComponentCapture';

interface ChangesDocumentationProps {
  comparisonId: string;
  componentName: string;
  status: string;
  changeDescription?: string;
  checkoutImages?: string[];
  isUpdating: boolean;
  onDescriptionSave: (comparisonId: string, description: string) => void;
  onImagesProcessed: (comparisonId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (comparisonId: string, processing: boolean) => void;
}

const ChangesDocumentation = ({
  comparisonId,
  componentName,
  status,
  changeDescription,
  checkoutImages = [],
  isUpdating,
  onDescriptionSave,
  onImagesProcessed,
  onProcessingStateChange
}: ChangesDocumentationProps) => {
  const [localDescription, setLocalDescription] = useState(changeDescription || '');

  const handleSaveDescription = () => {
    if (localDescription.trim()) {
      onDescriptionSave(comparisonId, localDescription.trim());
    }
  };

  if (status !== 'changed' && status !== 'pending') return null;

  return (
    <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium mb-2">
          Description of Changes
        </label>
        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="Describe what has changed since check-in..."
          className="min-h-[80px]"
        />
        {localDescription && localDescription !== changeDescription && (
          <Button
            size="sm"
            className="mt-2"
            onClick={handleSaveDescription}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Save Description
          </Button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Checkout Photos
        </label>
        <MultiImageComponentCapture
          componentId={comparisonId}
          componentName={componentName}
          roomType="general"
          isProcessing={isUpdating}
          currentImages={
            (checkoutImages as string[] || []).map((url, index) => ({
              id: `checkout-${comparisonId}-${index}`,
              url,
              timestamp: new Date()
            }))
          }
          onImagesProcessed={onImagesProcessed}
          onProcessingStateChange={onProcessingStateChange}
          onRemoveImage={() => {
            // Handle image removal if needed
          }}
        />
      </div>
    </div>
  );
};

export default ChangesDocumentation;
