
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Camera, Zap } from 'lucide-react';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleAIAnalysis = async () => {
    if (checkoutImages.length === 0) {
      toast({
        title: "No Images",
        description: "Please add checkout photos before running AI analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    onProcessingStateChange(comparisonId, true);

    try {
      await handleImagesProcessed(comparisonId, checkoutImages, { checkinData: {} });
    } finally {
      setIsAnalyzing(false);
      onProcessingStateChange(comparisonId, false);
    }
  };

  if (status !== 'changed' && status !== 'pending') return null;

  return (
    <div className="space-y-6 p-6 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="h-5 w-5 text-orange-600" />
        <h4 className="font-medium text-gray-900">Document Changes</h4>
      </div>

      {/* Description Input */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Description of Changes
        </label>
        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="Describe what has changed since check-in (damage, wear, cleanliness, etc.)..."
          className="min-h-[100px] bg-white"
        />
        {localDescription && localDescription !== changeDescription && (
          <Button
            size="sm"
            className="mt-3 bg-blue-600 hover:bg-blue-700"
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

      {/* Photo Capture */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Checkout Photos ({checkoutImages.length}/20)
          </label>
          {checkoutImages.length > 0 && (
            <Button
              onClick={handleAIAnalysis}
              disabled={isAnalyzing || isUpdating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              AI Analyse
            </Button>
          )}
        </div>
        
        <ImageCapture
          componentId={comparisonId}
          componentName={componentName}
          roomType="checkout"
          isProcessing={isUpdating || isAnalyzing}
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
          processComponentImage={(imageUrls, roomType, componentName, multipleImages) => 
            import('@/services/imageProcessingService').then(module => 
              module.processComponentImage(imageUrls, roomType, componentName, { multipleImages })
            )
          }
        />
      </div>

      {/* Helpful Tips */}
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <h5 className="text-sm font-medium text-blue-900 mb-1">Assessment Tips:</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Take photos from the same angles as the check-in reference</li>
          <li>• Focus on areas that show damage, wear, or cleanliness issues</li>
          <li>• Use the AI analysis for detailed condition assessment</li>
          <li>• Be specific in your description for clear documentation</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangesDocumentation;
