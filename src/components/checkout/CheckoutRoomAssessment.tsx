import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { useAssessmentActions } from '@/hooks/useAssessmentActions';
import { useToast } from '@/components/ui/use-toast';
import AssessmentInstructions from './AssessmentInstructions';
import ComponentAssessmentCard from './ComponentAssessmentCard';

interface CheckoutRoomAssessmentProps {
  checkoutReportId: string;
  comparisons: CheckoutComparison[];
  onComparisonUpdate: (updatedComparison: CheckoutComparison) => void;
}

const CheckoutRoomAssessment = ({ 
  checkoutReportId, 
  comparisons, 
  onComparisonUpdate 
}: CheckoutRoomAssessmentProps) => {
  const { toast } = useToast();
  const [currentComponentIndex, setCurrentComponentIndex] = useState(0);
  
  const {
    expandedComponent,
    isUpdating,
    changeDescriptions,
    handleStatusChange,
    handleDescriptionSave,
    handleImagesProcessed,
    toggleExpanded,
    setIsUpdating
  } = useAssessmentActions({ onComparisonUpdate });

  // Enhanced function to get proper room display names
  const getRoomDisplayName = (comparison: CheckoutComparison): string => {
    // First, try to get room name from AI analysis
    if (comparison.ai_analysis?.roomName) {
      return comparison.ai_analysis.roomName;
    }
    
    // Try to get room name from component data if available
    if (comparison.ai_analysis?.checkinData?.roomName) {
      return comparison.ai_analysis.checkinData.roomName;
    }
    
    // Check if room_id looks like a readable name (not a UUID)
    const roomId = comparison.room_id || 'general';
    if (roomId && !roomId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // If it's not a UUID, format it as a readable name
      return roomId.charAt(0).toUpperCase() + roomId.slice(1).replace(/[-_]/g, ' ');
    }
    
    // Fallback based on component name context
    if (comparison.component_name) {
      // Try to infer room type from component name
      const componentName = comparison.component_name.toLowerCase();
      if (componentName.includes('kitchen')) return 'Kitchen';
      if (componentName.includes('bathroom') || componentName.includes('toilet')) return 'Bathroom';
      if (componentName.includes('bedroom')) return 'Bedroom';
      if (componentName.includes('living') || componentName.includes('lounge')) return 'Living Room';
      if (componentName.includes('dining')) return 'Dining Room';
    }
    
    // Final fallback
    return 'General Assessment';
  };

  // Enhanced room grouping with better room name handling
  const roomGroups = comparisons.reduce((groups, comparison) => {
    const roomKey = comparison.room_id || 'general';
    const roomName = getRoomDisplayName(comparison);
    
    if (!groups[roomKey]) {
      groups[roomKey] = {
        name: roomName,
        components: []
      };
    }
    groups[roomKey].components.push(comparison);
    return groups;
  }, {} as Record<string, { name: string; components: CheckoutComparison[] }>);

  const handleSaveAndNext = async () => {
    if (currentComponentIndex < comparisons.length - 1) {
      setCurrentComponentIndex(currentComponentIndex + 1);
      // Auto-expand the next component
      const nextComparison = comparisons[currentComponentIndex + 1];
      if (nextComparison && expandedComponent !== nextComparison.id) {
        toggleExpanded(nextComparison.id);
      }
      
      toast({
        title: "Progress Saved",
        description: `Moving to component ${currentComponentIndex + 2} of ${comparisons.length}`,
      });
    }
  };

  const handleNext = () => {
    if (currentComponentIndex < comparisons.length - 1) {
      setCurrentComponentIndex(currentComponentIndex + 1);
      // Auto-expand the next component
      const nextComparison = comparisons[currentComponentIndex + 1];
      if (nextComparison && expandedComponent !== nextComparison.id) {
        toggleExpanded(nextComparison.id);
      }
    }
  };

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Components Found</h3>
        <p className="text-gray-600 mb-4">
          No components were found in the check-in report for assessment.
        </p>
        <p className="text-sm text-gray-500">
          This might happen if the check-in report doesn't have any components recorded,
          or if there was an issue extracting the component data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AssessmentInstructions />

      {Object.entries(roomGroups).map(([roomId, roomData]) => (
        <div key={roomId} className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                {roomData.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {roomData.components.length} component{roomData.components.length !== 1 ? 's' : ''} to assess
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              {roomData.components.map((comparison, index) => {
                const globalIndex = comparisons.findIndex(c => c.id === comparison.id);
                return (
                  <ComponentAssessmentCard
                    key={comparison.id}
                    comparison={comparison}
                    isExpanded={expandedComponent === comparison.id}
                    isUpdating={isUpdating[comparison.id] || false}
                    changeDescription={changeDescriptions[comparison.id] || ''}
                    currentIndex={globalIndex}
                    totalComponents={comparisons.length}
                    onToggleExpanded={toggleExpanded}
                    onStatusChange={handleStatusChange}
                    onDescriptionSave={handleDescriptionSave}
                    onImagesProcessed={handleImagesProcessed}
                    onProcessingStateChange={(componentId, processing) => 
                      setIsUpdating(prev => ({ ...prev, [componentId]: processing }))
                    }
                    onSaveAndNext={globalIndex === currentComponentIndex ? handleSaveAndNext : undefined}
                    onNext={globalIndex === currentComponentIndex ? handleNext : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CheckoutRoomAssessment;
