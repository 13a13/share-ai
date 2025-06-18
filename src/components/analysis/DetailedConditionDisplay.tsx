
import { EnhancedCondition, EnhancedConditionPoint, EnhancedConditionDetails } from "@/types/enhancedCondition";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DetailedConditionDisplayProps {
  condition: EnhancedCondition;
  componentName: string;
  showDetails?: boolean;
}

const DetailedConditionDisplay = ({ 
  condition, 
  componentName, 
  showDetails = true 
}: DetailedConditionDisplayProps) => {
  // Normalize condition points to handle both string and enhanced formats
  const normalizedPoints = condition.points?.map(point => {
    if (typeof point === 'string') {
      return {
        label: point,
        category: 'functional' as const,
        severity: 'minor' as const
      };
    }
    return point as EnhancedConditionPoint;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'major': return 'bg-red-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-white';
      case 'minor': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return <AlertTriangle className="h-3 w-3" />;
      case 'structural': return <XCircle className="h-3 w-3" />;
      case 'functional': return <AlertCircle className="h-3 w-3" />;
      case 'aesthetic': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'text-red-600';
      case 'structural': return 'text-orange-600';
      case 'functional': return 'text-blue-600';
      case 'aesthetic': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Group points by category
  const pointsByCategory = normalizedPoints.reduce((acc, point) => {
    const category = point.category || 'functional';
    if (!acc[category]) acc[category] = [];
    acc[category].push(point);
    return acc;
  }, {} as Record<string, EnhancedConditionPoint[]>);

  return (
    <div className="space-y-4">
      {/* Assessment Detail - Primary Display */}
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Assessment Detail
        </h4>
        <p className="text-sm text-blue-800 leading-relaxed">{condition.summary}</p>
      </div>

      {/* Condition Points by Category */}
      {Object.keys(pointsByCategory).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Detailed Findings</h4>
          {Object.entries(pointsByCategory).map(([category, points]) => (
            <Card key={category} className="border-l-4 border-l-gray-300">
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm flex items-center gap-2 ${getCategoryColor(category)}`}>
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {points.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getSeverityColor(point.severity || 'minor')}`}
                      >
                        {point.severity || 'minor'}
                      </Badge>
                      <span className="text-sm text-gray-700 flex-1">{point.label}</span>
                      {point.validationStatus && (
                        <Badge variant="outline" className="text-xs">
                          {point.validationStatus}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enhanced Details */}
      {showDetails && condition.details && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Technical Assessment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(condition.details).map(([key, value]) => {
              if (value === 'Assessment completed' || value === 'Assessment required') return null;
              
              const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              return (
                <Card key={key} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-gray-600">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-800">{value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback for simple points */}
      {Object.keys(pointsByCategory).length === 0 && condition.points?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Assessment Points</h4>
          <ul className="space-y-1">
            {condition.points.map((point, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {typeof point === 'string' ? point : point.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DetailedConditionDisplay;
