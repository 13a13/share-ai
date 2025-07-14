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

  // Helper function to extract values from nested object structures
  const extractValue = (obj: any, paths: string[], defaultValue: any = null): any => {
    for (const path of paths) {
      try {
        const value = path.split('.').reduce((current, key) => current?.[key], obj);
        if (value !== undefined && value !== null && value !== '') {
          console.log(`🎯 [COMPONENT PROCESSING] Found value for path ${path}:`, value);
          return value;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    console.log(`⚠️ [COMPONENT PROCESSING] No value found for paths ${paths.join(', ')}, using default:`, defaultValue);
    return defaultValue;
  };

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

      // Create a clean copy of the analysis data to prevent circular references
      const cleanAnalysisData = JSON.parse(JSON.stringify(result));
      
      try {
        await ReportsAPI.updateComponentAnalysis(
          reportId,
          roomId, 
          componentId,
          cleanAnalysisData,
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

      // Enhanced data extraction with comprehensive fallback mapping and debugging
      console.log(`🔍 [COMPONENT PROCESSING] Processing result structure:`, {
        type: typeof result,
        keys: Object.keys(result || {}),
        stringified: JSON.stringify(result, null, 2).substring(0, 500)
      });
      
      const description = extractValue(result, [
        'description',
        'parsedData.description', 
        'data.description',
        'analysis.description'
      ], 'Analysis completed');
      
      const conditionRating = extractValue(result, [
        'condition.rating',
        'parsedData.condition.rating',
        'data.condition.rating',
        'rating',
        'condition_rating'
      ], 'fair');
      
      const cleanliness = extractValue(result, [
        'cleanliness',
        'parsedData.cleanliness',
        'data.cleanliness',
        'cleaning_status'
      ], 'domestic_clean');
      
      const conditionSummary = extractValue(result, [
        'condition.summary',
        'parsedData.condition.summary',
        'data.condition.summary',
        'summary',
        'condition_summary',
        'notes'
      ], '');
      
      const conditionPoints = extractValue(result, [
        'condition.points',
        'parsedData.condition.points',
        'data.condition.points',
        'points',
        'condition_points'
      ], []);

      console.log(`✅ [COMPONENT PROCESSING] Extracted data with validation:`, {
        description: `"${description}" (length: ${description?.length || 0})`,
        conditionRating: `"${conditionRating}"`,
        cleanliness: `"${cleanliness}"`,
        conditionSummary: `"${conditionSummary}" (length: ${conditionSummary?.length || 0})`,
        conditionPoints: `Array with ${conditionPoints?.length || 0} items`,
        hasValidDescription: description && description !== 'Analysis completed' && description.trim().length > 0,
        hasValidConditionSummary: conditionSummary && conditionSummary.trim().length > 0,
        hasValidConditionPoints: Array.isArray(conditionPoints) && conditionPoints.length > 0
      });
      
      // Enhanced validation and fallback for empty fields
      if (!description || description === 'Analysis completed') {
        console.warn('⚠️ [COMPONENT PROCESSING] Empty or default description detected');
      }
      
      if (!conditionSummary || conditionSummary.trim().length === 0) {
        console.warn('⚠️ [COMPONENT PROCESSING] Empty condition summary detected');
      }
      
      if (!Array.isArray(conditionPoints) || conditionPoints.length === 0) {
        console.warn('⚠️ [COMPONENT PROCESSING] No condition points detected');
      }

      // Update the component with AI analysis data
      const updatedComponents = components.map(comp => {
        if (comp.id === componentId) {
          return {
            ...comp,
            images: imageUrls.map((url, index) => ({
              id: imageIds[index] || `temp-${Date.now()}-${index}`,
              url,
              timestamp: new Date(),
              analysis: cleanAnalysisData,
              aiProcessed: true,
              aiData: cleanAnalysisData
            })),
            description: description,
            condition: conditionRating,
            cleanliness: cleanliness,
            notes: conditionSummary,
            conditionSummary: conditionSummary,
            conditionPoints: Array.isArray(conditionPoints) ? conditionPoints : []
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