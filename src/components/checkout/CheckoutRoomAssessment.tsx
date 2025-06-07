
import { AlertTriangle } from 'lucide-react';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { useAssessmentActions } from '@/hooks/useAssessmentActions';
import AssessmentInstructions from './AssessmentInstructions';
import RoomAssessmentCard from './RoomAssessmentCard';

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

  // Helper function to get display name for rooms
  const getRoomDisplayName = (roomId: string, comparison: CheckoutComparison): string => {
    if (roomId === 'general') return 'General Assessment';
    
    // Try to extract room name from component data
    if (comparison.ai_analysis?.roomName) {
      return comparison.ai_analysis.roomName;
    }
    
    // Fallback to formatted room ID
    return roomId.charAt(0).toUpperCase() + roomId.slice(1).replace(/[-_]/g, ' ');
  };

  // Enhanced room grouping with better room name handling
  const roomGroups = comparisons.reduce((groups, comparison) => {
    const roomKey = comparison.room_id || 'general';
    const roomName = getRoomDisplayName(comparison.room_id, comparison);
    
    if (!groups[roomKey]) {
      groups[roomKey] = {
        name: roomName,
        components: []
      };
    }
    groups[roomKey].components.push(comparison);
    return groups;
  }, {} as Record<string, { name: string; components: CheckoutComparison[] }>);

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
        <RoomAssessmentCard
          key={roomId}
          roomId={roomId}
          roomName={roomData.name}
          components={roomData.components}
          expandedComponent={expandedComponent}
          isUpdating={isUpdating}
          changeDescriptions={changeDescriptions}
          onToggleExpanded={toggleExpanded}
          onStatusChange={handleStatusChange}
          onDescriptionSave={handleDescriptionSave}
          onImagesProcessed={handleImagesProcessed}
          onProcessingStateChange={(componentId, processing) => 
            setIsUpdating(prev => ({ ...prev, [componentId]: processing }))
          }
        />
      ))}
    </div>
  );
};

export default CheckoutRoomAssessment;
