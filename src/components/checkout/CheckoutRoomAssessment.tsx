
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Camera, AlertTriangle, Loader2 } from 'lucide-react';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { CheckoutComparisonAPI } from '@/lib/api/reports/checkoutComparisonApi';
import { useToast } from '@/components/ui/use-toast';
import MultiImageComponentCapture from '@/components/image-upload/MultiImageComponentCapture';

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

  // Group comparisons by room
  const roomGroups = comparisons.reduce((groups, comparison) => {
    if (!groups[comparison.room_id]) {
      groups[comparison.room_id] = [];
    }
    groups[comparison.room_id].push(comparison);
    return groups;
  }, {} as Record<string, CheckoutComparison[]>);

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
          description: `Component marked as ${status}`,
        });
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

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        Assess each component to determine if there are any changes since check-in. 
        Mark items as "No Changes" or add photos and descriptions for any changes found.
      </div>

      {Object.entries(roomGroups).map(([roomId, roomComparisons]) => (
        <Card key={roomId} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Room: {roomId}
              <Badge className="ml-2 bg-blue-500">
                {roomComparisons.length} components
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roomComparisons.map((comparison) => (
              <Card key={comparison.id} className="border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{comparison.component_name}</h4>
                      <Badge 
                        className={
                          comparison.status === 'unchanged' ? 'bg-green-500' :
                          comparison.status === 'changed' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }
                      >
                        {comparison.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedComponent(
                        expandedComponent === comparison.id ? null : comparison.id
                      )}
                    >
                      {expandedComponent === comparison.id ? 'Collapse' : 'Assess'}
                    </Button>
                  </div>
                </CardHeader>

                {expandedComponent === comparison.id && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onClick={() => setExpandedComponent(comparison.id)}
                        variant="outline"
                        className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Found Changes
                      </Button>
                    </div>

                    {comparison.status === 'changed' && (
                      <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Description of Changes
                          </label>
                          <Textarea
                            value={comparison.change_description || ''}
                            onChange={(e) => {
                              // Update local state and save to backend
                              handleStatusChange(
                                comparison.id, 
                                'changed', 
                                e.target.value
                              );
                            }}
                            placeholder="Describe what has changed since check-in..."
                            className="min-h-[80px]"
                          />
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
                  </CardContent>
                )}
              </Card>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CheckoutRoomAssessment;
