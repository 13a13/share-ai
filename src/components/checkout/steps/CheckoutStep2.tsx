
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import { CheckoutData } from '@/lib/api/reports/checkoutTypes';

interface CheckoutStep2Props {
  checkoutData: CheckoutData;
  onInitializeAssessments: () => void;
  isLoadingComparisons: boolean;
}

const CheckoutStep2 = ({ 
  checkoutData, 
  onInitializeAssessments, 
  isLoadingComparisons 
}: CheckoutStep2Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Step 2: Setup Component Assessments</span>
          <Badge className="bg-green-500">Process Started</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-green-800 mb-2">Checkout Details:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Date:</span>
              <p className="font-medium">{new Date(checkoutData.date).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-gray-600">Clerk:</span>
              <p className="font-medium">{checkoutData.clerk || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Tenant:</span>
              <p className="font-medium">{checkoutData.tenantName || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Tenant Present:</span>
              <p className="font-medium">{checkoutData.tenantPresent ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          Now we'll prepare the components from your check-in report for assessment.
        </p>

        <Button 
          onClick={onInitializeAssessments}
          disabled={isLoadingComparisons}
          size="lg"
        >
          {isLoadingComparisons ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing Components...
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Start Component Assessment
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CheckoutStep2;
