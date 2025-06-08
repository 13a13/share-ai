
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface CheckoutProgressProps {
  currentStep: number;
}

const CheckoutProgress = ({ currentStep }: CheckoutProgressProps) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm">Create Checkout</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="ml-2 text-sm">Setup Components</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
              {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : '3'}
            </div>
            <span className="ml-2 text-sm">Assess Components</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutProgress;
