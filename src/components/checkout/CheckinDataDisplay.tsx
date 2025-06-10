
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';

interface CheckinDataDisplayProps {
  componentName: string;
  checkinData: {
    originalCondition?: string;
    originalDescription?: string;
    originalImages?: string[];
    timestamp?: string;
  };
  condition?: string;
  conditionSummary?: string;
  description?: string;
  images?: string[];
}

const CheckinDataDisplay = ({
  componentName,
  checkinData,
  condition,
  conditionSummary,
  description,
  images = []
}: CheckinDataDisplayProps) => {
  // Enhanced data extraction with better fallbacks
  const displayImages = images?.length > 0 ? images : (checkinData?.originalImages || []);
  const displayDescription = description || checkinData?.originalDescription || '';
  const displayCondition = condition || checkinData?.originalCondition || 'Unknown';
  
  console.log('CheckinDataDisplay props:', {
    componentName,
    checkinData,
    condition,
    description,
    images,
    displayImages,
    displayDescription,
    displayCondition
  });

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-orange-500';
      case 'very poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const hasAnyData = displayImages.length > 0 || displayDescription.trim() !== '';

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Check-in Reference: {componentName}
          </span>
          <div className="flex items-center gap-2">
            <Badge className={`${getConditionColor(displayCondition)} text-white`}>
              {displayCondition}
            </Badge>
            {checkinData?.timestamp && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {new Date(checkinData.timestamp).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Condition Summary */}
        {conditionSummary && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Condition Summary</h4>
            <p className="text-sm text-gray-600 bg-white p-2 rounded border">
              {conditionSummary}
            </p>
          </div>
        )}

        {/* Description */}
        {displayDescription && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Check-in Description</h4>
            <p className="text-sm text-gray-600 bg-white p-2 rounded border">
              {displayDescription}
            </p>
          </div>
        )}

        {/* Images */}
        {displayImages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              Check-in Images ({displayImages.length})
            </h4>
            <ScrollArea className="max-h-48">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {displayImages.map((imageUrl, index) => (
                  <div key={index} className="relative border rounded overflow-hidden aspect-square bg-white">
                    <img 
                      src={imageUrl} 
                      alt={`Check-in ${componentName} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white p-1 text-xs text-center">
                      Check-in #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No data message */}
        {!hasAnyData && (
          <div className="flex items-center gap-2 text-gray-500 text-sm bg-white p-3 rounded border">
            <AlertCircle className="h-4 w-4" />
            <span>
              No detailed check-in data available for this component. 
              {checkinData ? ' Check-in data structure exists but may be empty.' : ' No check-in data found.'}
            </span>
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-400">
            <summary>Debug: Data Sources</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify({
                hasCheckinData: !!checkinData,
                checkinDataKeys: checkinData ? Object.keys(checkinData) : [],
                hasImages: displayImages.length > 0,
                hasDescription: !!displayDescription,
                condition: displayCondition
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckinDataDisplay;
