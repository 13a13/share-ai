
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import ComponentAssessmentCard from './ComponentAssessmentCard';

interface RoomAssessmentCardProps {
  roomId: string;
  roomName: string;
  components: CheckoutComparison[];
  expandedComponent: string | null;
  isUpdating: Record<string, boolean>;
  changeDescriptions: Record<string, string>;
  onToggleExpanded: (comparisonId: string) => void;
  onStatusChange: (comparisonId: string, status: 'unchanged' | 'changed') => void;
  onDescriptionSave: (comparisonId: string, description: string) => void;
  onImagesProcessed: (comparisonId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (comparisonId: string, processing: boolean) => void;
}

const RoomAssessmentCard = ({
  roomId,
  roomName,
  components,
  expandedComponent,
  isUpdating,
  changeDescriptions,
  onToggleExpanded,
  onStatusChange,
  onDescriptionSave,
  onImagesProcessed,
  onProcessingStateChange
}: RoomAssessmentCardProps) => {
  return (
    <Card key={roomId} className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{roomName}</span>
          <div className="flex gap-2">
            <Badge className="bg-blue-500">
              {components.length} component{components.length !== 1 ? 's' : ''}
            </Badge>
            <Badge className="bg-green-500">
              {components.filter(c => c.status !== 'pending').length} assessed
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {components.map((comparison) => (
          <div key={comparison.id} className="space-y-3">
            <ComponentAssessmentCard
              comparison={comparison}
              isExpanded={expandedComponent === comparison.id}
              isUpdating={isUpdating[comparison.id] || false}
              changeDescription={changeDescriptions[comparison.id] || comparison.change_description || ''}
              onToggleExpanded={onToggleExpanded}
              onStatusChange={onStatusChange}
              onDescriptionSave={onDescriptionSave}
              onImagesProcessed={onImagesProcessed}
              onProcessingStateChange={onProcessingStateChange}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RoomAssessmentCard;
