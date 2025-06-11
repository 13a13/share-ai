
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

  // Check if this component has valid data (should have both description and images)
  const hasValidDescription = displayDescription && displayDescription.trim() !== '';
  const hasValidImages = displayImages.length > 0;
  const hasValidData = hasValidDescription && hasValidImages;

  // If this component doesn't have valid data, it shouldn't be shown in checkout
  // But this component might still render for debugging - show clear indicators
  if (!hasValidData) {
    return (
      <Card className="mb-4 border-red-200 bg-red-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Invalid Component: {componentName}
            </span>
            <Badge className="bg-red-500 text-white">
              Should be filtered out
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 p-3 rounded border border-red-200">
            <AlertCircle className="h-4 w-4" />
            <span>
              This component is missing required check-in data and should not appear in checkout assessment.
              Missing: {!hasValidDescription && 'description'}{!hasValidDescription && !hasValidImages && ' and '}{!hasValidImages && 'images'}
            </span>
          </div>

          {/* Debug info */}
          <details className="text-xs text-gray-400">
            <summary>Debug: Component Data Issues</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify({
                hasValidDescription,
                hasValidImages,
                descriptionLength: displayDescription?.length || 0,
                imageCount: displayImages.length,
                shouldBeFiltered: true
              }, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    );
  }

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

        {/* Description - Guaranteed to exist for valid components */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Check-in Description</h4>
          <p className="text-sm text-gray-600 bg-white p-2 rounded border">
            {displayDescription}
          </p>
        </div>

        {/* Images - Guaranteed to exist for valid components */}
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

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-400">
            <summary>Debug: Valid Component Data</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify({
                hasValidData: true,
                hasDescription: hasValidDescription,
                hasImages: hasValidImages,
                descriptionLength: displayDescription.length,
                imageCount: displayImages.length
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckinDataDisplay;
