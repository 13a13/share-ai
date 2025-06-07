import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Camera, AlertTriangle, Loader2, Eye, EyeOff, Plus, FileText } from 'lucide-react';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { CheckoutComparisonAPI } from '@/lib/api/reports/checkoutComparisonApi';
import { useToast } from '@/components/ui/use-toast';
import MultiImageComponentCapture from '@/components/image-upload/MultiImageComponentCapture';
import CheckinDataDisplay from './CheckinDataDisplay';

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
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [changeDescriptions, setChangeDescriptions] = useState<Record<string, string>>({});

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

  const handleStatusChange = async (
    comparisonId: string, 
    status: 'unchanged' | 'changed', 
    changeDescription?: string
  ) => {
    setIsUpdating(prev => ({ ...prev, [comparisonId]: true }));
    
    try {
      const updatedComparison = await CheckoutComparisonAPI.updateCheckoutComparison(
        comparisonId,
        { 
          status, 
          change_description: changeDescription || null,
          updated_at: new Date().toISOString()
        }
      );

      if (updatedComparison) {
        onComparisonUpdate(updatedComparison);
        toast({
          title: "Assessment Updated",
          description: `Component marked as ${status === 'unchanged' ? 'no changes' : 'changed'}`,
        });
        
        // Collapse the component if marked as unchanged
        if (status === 'unchanged') {
          setExpandedComponent(null);
        }
      }
    } catch (error) {
      console.error('Error updating comparison:', error);
      toast({
        title: "Error",
        description: "Failed to update assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(prev => ({ ...prev, [comparisonId]: false }));
    }
  };

  const handleDescriptionChange = (comparisonId: string, description: string) => {
    setChangeDescriptions(prev => ({ ...prev, [comparisonId]: description }));
  };

  const saveDescription = async (comparisonId: string) => {
    const description = changeDescriptions[comparisonId];
    if (description && description.trim()) {
      await handleStatusChange(comparisonId, 'changed', description.trim());
    }
  };

  const handleImagesProcessed = async (
    comparisonId: string,
    imageUrls: string[],
    result: any
  ) => {
    setIsUpdating(prev => ({ ...prev, [comparisonId]: true }));
    
    try {
      const updatedComparison = await CheckoutComparisonAPI.updateCheckoutComparison(
        comparisonId,
        { 
          checkout_images: imageUrls,
          checkout_condition: result.description || '',
          status: 'changed',
          change_description: result.notes || 'Images added during checkout',
          ai_analysis: result,
          updated_at: new Date().toISOString()
        }
      );

      if (updatedComparison) {
        onComparisonUpdate(updatedComparison);
        toast({
          title: "Photos Added",
          description: "Checkout photos have been processed and saved.",
        });
      }
    } catch (error) {
      console.error('Error saving checkout images:', error);
      toast({
        title: "Error",
        description: "Failed to save checkout photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(prev => ({ ...prev, [comparisonId]: false }));
    }
  };

  const toggleExpanded = (comparisonId: string) => {
    setExpandedComponent(expandedComponent === comparisonId ? null : comparisonId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unchanged': return 'bg-green-500';
      case 'changed': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unchanged': return <CheckCircle className="h-4 w-4" />;
      case 'changed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
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
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Assessment Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Review the check-in reference data for each component</li>
          <li>• Click on each component to expand and assess its current condition</li>
          <li>• Mark as "No Changes" if the component looks the same as check-in</li>
          <li>• Mark as "Changes Found" if you notice any differences</li>
          <li>• Take photos and add descriptions for any changes</li>
        </ul>
      </div>

      {Object.entries(roomGroups).map(([roomId, roomData]) => (
        <Card key={roomId} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{roomData.name}</span>
              <div className="flex gap-2">
                <Badge className="bg-blue-500">
                  {roomData.components.length} component{roomData.components.length !== 1 ? 's' : ''}
                </Badge>
                <Badge className="bg-green-500">
                  {roomData.components.filter(c => c.status !== 'pending').length} assessed
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roomData.components.map((comparison) => (
              <div key={comparison.id} className="space-y-3">
                {/* Component Assessment Card */}
                <Card className="border border-gray-200 transition-all hover:border-blue-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getStatusColor(comparison.status)}`}>
                          {getStatusIcon(comparison.status)}
                        </div>
                        <div>
                          <h4 className="font-medium">{comparison.component_name}</h4>
                          <p className="text-sm text-gray-500">
                            Status: {comparison.status === 'pending' ? 'Awaiting Assessment' : 
                                     comparison.status === 'unchanged' ? 'No Changes' : 'Changes Found'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(comparison.id)}
                        disabled={isUpdating[comparison.id]}
                      >
                        {expandedComponent === comparison.id ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Assess
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {expandedComponent === comparison.id && (
                    <CardContent className="space-y-4 border-t">
                      {/* Check-in Reference Data */}
                      <CheckinDataDisplay
                        componentName={comparison.component_name}
                        checkinData={{
                          originalCondition: comparison.ai_analysis?.checkinData?.originalCondition,
                          originalDescription: comparison.ai_analysis?.checkinData?.originalDescription,
                          originalImages: comparison.ai_analysis?.checkinData?.originalImages,
                          timestamp: comparison.ai_analysis?.checkinData?.timestamp
                        }}
                        condition={comparison.ai_analysis?.condition}
                        conditionSummary={comparison.ai_analysis?.conditionSummary}
                        description={comparison.ai_analysis?.description}
                        images={comparison.ai_analysis?.images}
                      />

                      {/* Assessment Actions */}
                      {comparison.status === 'pending' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                          <Button
                            onClick={() => handleStatusChange(comparison.id, 'unchanged')}
                            disabled={isUpdating[comparison.id]}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {isUpdating[comparison.id] ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            No Changes
                          </Button>
                          
                          <Button
                            onClick={() => {
                              // Auto-expand the changes section
                              setExpandedComponent(comparison.id);
                            }}
                            variant="outline"
                            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Found Changes
                          </Button>
                        </div>
                      )}

                      {/* Changes Documentation */}
                      {(comparison.status === 'changed' || comparison.status === 'pending') && (
                        <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Description of Changes
                            </label>
                            <Textarea
                              value={changeDescriptions[comparison.id] || comparison.change_description || ''}
                              onChange={(e) => handleDescriptionChange(comparison.id, e.target.value)}
                              placeholder="Describe what has changed since check-in..."
                              className="min-h-[80px]"
                            />
                            {changeDescriptions[comparison.id] && (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => saveDescription(comparison.id)}
                                disabled={isUpdating[comparison.id]}
                              >
                                {isUpdating[comparison.id] ? (
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
                            <MultiImageComponentCapture
                              componentId={comparison.id}
                              componentName={comparison.component_name}
                              roomType="general"
                              isProcessing={isUpdating[comparison.id] || false}
                              currentImages={
                                (comparison.checkout_images as string[] || []).map((url, index) => ({
                                  id: `checkout-${comparison.id}-${index}`,
                                  url,
                                  timestamp: new Date()
                                }))
                              }
                              onImagesProcessed={(componentId, imageUrls, result) => 
                                handleImagesProcessed(componentId, imageUrls, result)
                              }
                              onProcessingStateChange={(componentId, processing) => 
                                setIsUpdating(prev => ({ ...prev, [componentId]: processing }))
                              }
                              onRemoveImage={() => {
                                // Handle image removal if needed
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Completed Assessment Display */}
                      {comparison.status === 'unchanged' && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">No Changes Detected</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            This component appears to be in the same condition as during check-in.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CheckoutRoomAssessment;
