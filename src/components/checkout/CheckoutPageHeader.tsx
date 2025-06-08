
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CheckoutPageHeaderProps {
  currentStep: number;
  propertyName: string;
  checkoutReport: any;
  onSaveReport: () => void;
}

const CheckoutPageHeader = ({
  currentStep,
  propertyName,
  checkoutReport,
  onSaveReport
}: CheckoutPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Checkout Procedure - Step {currentStep}</h1>
          <p className="text-gray-600">
            Property: {propertyName || 'Unknown Property'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {currentStep === 3 && checkoutReport && (
          <Button onClick={onSaveReport} className="bg-blue-600 hover:bg-blue-700">
            <FileCheck className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        )}
      </div>
    </div>
  );
};

export default CheckoutPageHeader;
