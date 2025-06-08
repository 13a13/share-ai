
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';

interface CheckoutStep2Props {
  checkoutReport: any;
  onInitializeComparisons: () => void;
  isLoadingComparisons: boolean;
}

const CheckoutStep2 = ({ 
  checkoutReport, 
  onInitializeComparisons, 
  isLoadingComparisons 
}: CheckoutStep2Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Step 2: Initialize Component Comparisons</span>
          <Badge className="bg-green-500">Checkout Created</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-green-800 mb-2">Checkout Details:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Checkout ID:</span>
              <p className="font-medium">{checkoutReport.id}</p>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <p className="font-medium">{checkoutReport.status}</p>
            </div>
            <div>
              <span className="text-gray-600">Clerk:</span>
              <p className="font-medium">{checkoutReport.checkout_clerk || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Tenant:</span>
              <p className="font-medium">{checkoutReport.checkout_tenant_name || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          Now we'll set up component comparisons from your original check-in report.
        </p>

        <Button 
          onClick={onInitializeComparisons}
          disabled={isLoadingComparisons}
          size="lg"
        >
          {isLoadingComparisons ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up Components...
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Initialize Component Comparisons
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CheckoutStep2;
