import { RoomComponent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ReportsAPI } from '@/lib/api';

interface UseComponentImageProcessingProps {
  components: RoomComponent[];
  expandedComponents: string[];
  setComponents: (updatedComponents: RoomComponent[]) => void;
  setExpandedComponents: (ids: string[]) => void;
  onChange: (updatedComponents: RoomComponent[]) => void;
  reportId: string;
  roomId: string;
}

function useComponentImageProcessing(props: UseComponentImageProcessingProps) {
  const { 
    components, 
    expandedComponents, 
    setComponents, 
    setExpandedComponents, 
    onChange, 
    reportId, 
    roomId 
  } = props;
  
  const { toast } = useToast();

  const handleImagesProcessed = async (
    componentId: string, 
    imageUrls: string[], 
    result: any,
    imageIds: string[] = []
  ) => {
    try {
      console.log(`🔄 Updating component ${componentId} with analysis results`);
      
      // Check if we have a valid result
      if (!result || typeof result !== 'object') {
        console.warn('⚠️ Invalid analysis result received:', result);
        throw new Error('Invalid analysis result received from server');
      }

      // Save analysis to database with retry logic
      let analysisData = result;
      try {
        await ReportsAPI.updateComponentAnalysis(
          reportId,
          roomId, 
          componentId,
          result,
          imageIds
        );
        console.log('✅ Analysis saved to database successfully');
      } catch (dbError) {
        console.error('❌ Failed to save analysis to database:', dbError);
        // Continue with UI update even if database save fails
        toast({
          title: "Partial Success",
          description: "Analysis completed but may not be fully saved. Please refresh if data appears missing.",
          variant: "destructive"
        });
      }

      // Extract meaningful data from result, handling both formats
      const description = result.description || 
                         result.parsedData?.description || 
                         'Analysis completed';
      
      const condition = result.condition?.rating || 
                       result.parsedData?.condition?.rating || 
                       'fair';
      
      const cleanliness = result.cleanliness || 
                         result.parsedData?.cleanliness || 
                         'domestic_clean';
      
      const notes = result.condition?.summary || 
                   result.parsedData?.condition?.summary || 
                   'Analysis completed';

      // Extract condition summary and points for proper UI display
      const conditionSummary = result.condition?.summary || 
                              result.parsedData?.condition?.summary || 
                              '';
      
      const conditionPoints = result.condition?.points || 
                             result.parsedData?.condition?.points || 
                             [];

      // Update the component with AI analysis data
      const updatedComponents = components.map(comp => {
        if (comp.id === componentId) {
          return {
            ...comp,
            images: imageUrls.map((url, index) => ({
              id: imageIds[index] || `temp-${Date.now()}-${index}`,
              url,
              timestamp: new Date(),
              analysis: analysisData,
              aiProcessed: true,
              aiData: analysisData
            })),
            description: description,
            condition: condition,
            cleanliness: cleanliness,
            notes: notes,
            conditionSummary: conditionSummary,
            conditionPoints: conditionPoints
          };
        }
        return comp;
      });
    
      setComponents(updatedComponents);
      onChange(updatedComponents);
      
      // Ensure the component is expanded to show analysis results
      if (!expandedComponents.includes(componentId)) {
        setExpandedComponents([...expandedComponents, componentId]);
      }
      
      // Scroll to the component element
      setTimeout(() => {
        const element = document.getElementById(`component-${componentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a brief highlight effect
          element.classList.add('highlight-component');
          setTimeout(() => {
            element.classList.remove('highlight-component');
          }, 3000);
        }
      }, 300);
      
      toast({
        title: "AI Analysis Complete",
        description: "The component has been analyzed and details are now available for editing.",
      });
    } catch (error) {
      console.error('❌ Error processing component images:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to analyze component images. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid analysis result')) {
          errorMessage = "Analysis completed but results were invalid. Please try uploading different images.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error occurred. Please check your connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Analysis is taking longer than expected. Please try with fewer or smaller images.";
        }
      }
      
      toast({
        title: "Analysis Error", 
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  return {
    handleImagesProcessed
  };
}

export default useComponentImageProcessing;