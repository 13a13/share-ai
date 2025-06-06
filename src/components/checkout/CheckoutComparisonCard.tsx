
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Check, AlertTriangle, Eye } from 'lucide-react';
import { CheckoutComparison } from '@/lib/api/reports/checkoutApi';
import { RoomComponent, ConditionRating } from '@/types';

interface CheckoutComparisonCardProps {
  comparison: CheckoutComparison;
  originalComponent: RoomComponent | null;
  onUpdate: (comparisonId: string, updates: Partial<CheckoutComparison>) => void;
}

const CheckoutComparisonCard = ({
  comparison,
  originalComponent,
  onUpdate
}: CheckoutComparisonCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: comparison.status,
    checkout_condition: comparison.checkout_condition || originalComponent?.condition || 'fair',
    change_description: comparison.change_description || ''
  });

  const handleSave = () => {
    onUpdate(comparison.id, {
      status: formData.status,
      checkout_condition: formData.checkout_condition,
      change_description: formData.change_description
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unchanged': return 'bg-green-100 text-green-800';
      case 'changed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'needs_replacement': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{comparison.component_name}</CardTitle>
          <Badge className={getStatusColor(comparison.status)}>
            {comparison.status === 'unchanged' && <Check className="h-3 w-3 mr-1" />}
            {comparison.status === 'changed' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {comparison.status === 'pending' && <Eye className="h-3 w-3 mr-1" />}
            {comparison.status.charAt(0).toUpperCase() + comparison.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Original Condition */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Check-in Condition</h4>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${getConditionColor(originalComponent?.condition || 'fair')}`}>
              {originalComponent?.condition?.replace('_', ' ').toUpperCase() || 'FAIR'}
            </span>
          </div>
          {originalComponent?.description && (
            <p className="text-sm text-gray-600 mt-1">{originalComponent.description}</p>
          )}
        </div>

        {/* Checkout Assessment */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Checkout Assessment</h4>
          
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unchanged">Unchanged</SelectItem>
                    <SelectItem value="changed">Changed</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Current Condition</label>
                <Select 
                  value={formData.checkout_condition} 
                  onValueChange={(value) => setFormData({ ...formData, checkout_condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="needs_replacement">Needs Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'changed' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Change Description</label>
                  <Textarea
                    value={formData.change_description}
                    onChange={(e) => setFormData({ ...formData, change_description: e.target.value })}
                    placeholder="Describe what has changed..."
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  Save Assessment
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Current condition:</span>
                <span className={`font-medium ${getConditionColor(comparison.checkout_condition || 'fair')}`}>
                  {comparison.checkout_condition?.replace('_', ' ').toUpperCase() || 'NOT ASSESSED'}
                </span>
              </div>
              
              {comparison.change_description && (
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Change noted:</strong> {comparison.change_description}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                  {comparison.status === 'pending' ? 'Assess Component' : 'Edit Assessment'}
                </Button>
                <Button size="sm" variant="outline">
                  <Camera className="h-4 w-4 mr-1" />
                  Add Photos
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutComparisonCard;
