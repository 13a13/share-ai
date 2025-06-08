
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Report } from '@/types';
import { CheckoutData } from '@/lib/api/reports/checkoutTypes';
import CheckoutProcedureDialog from '../CheckoutProcedureDialog';

interface CheckoutStep1Props {
  checkinReport: Report;
  onStartCheckout: (checkoutData: CheckoutData) => void;
  isCreating: boolean;
}

const CheckoutStep1 = ({ checkinReport, onStartCheckout, isCreating }: CheckoutStep1Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Create Checkout Record</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          Create a basic checkout record with your details and checkout information.
        </p>
        <CheckoutProcedureDialog
          checkinReport={checkinReport}
          onStartCheckout={onStartCheckout}
          isCreating={isCreating}
        >
          <Button disabled={isCreating} size="lg">
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Checkout...
              </>
            ) : (
              'Start Checkout Procedure'
            )}
          </Button>
        </CheckoutProcedureDialog>
      </CardContent>
    </Card>
  );
};

export default CheckoutStep1;
