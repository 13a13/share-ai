
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { processCheckoutImages } from '@/services/checkoutImageProcessingService';
import ImageCapture from '@/components/common/ImageCapture';

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
  const { toast } = useToast();
  const [localDescription, setLocalDescription] = useState(changeDescription || '');

  const handleSaveDescription = () => {
    if (localDescription.trim()) {
      onDescriptionSave(comparisonId, localDescription.trim());
    }
  };

  const handleImagesProcessed = async (componentId: string, imageUrls: string[], result: any) => {
    try {
      console.log('Processing checkout images for comparison:', componentId, imageUrls);
      
      // Call the checkout-specific image processing
      const checkoutResult = await processCheckoutImages(
        imageUrls,
        componentName,
        result.checkinData
      );
      
      onImagesProcessed(componentId, imageUrls, checkoutResult);
      
      toast({
        title: "Images Analyzed",
        description: "Checkout images have been processed successfully.",
      });
    } catch (error) {
      console.error('Error processing checkout images:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze images. Please try again.",
        variant: "destructive",
      });
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
        <ImageCapture
          componentId={comparisonId}
          componentName={componentName}
          roomType="checkout"
          isProcessing={isUpdating}
          currentImages={
            (checkoutImages as string[] || []).map((url, index) => ({
              id: `checkout-${comparisonId}-${index}`,
              url,
              timestamp: new Date()
            }))
          }
          onImagesProcessed={handleImagesProcessed}
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
