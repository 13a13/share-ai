
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CheckoutPageHeaderProps {
  currentStep: number;
  propertyName?: string;
  isDraftSaved?: boolean;
}

const CheckoutPageHeader = ({ 
  currentStep, 
  propertyName,
  isDraftSaved = false 
}: CheckoutPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout Process</h1>
          <p className="text-gray-600">
            {propertyName && `Property: ${propertyName}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isDraftSaved && (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Save className="h-3 w-3 mr-1" />
            Draft Saved
          </Badge>
        )}
        
        <Badge className="bg-blue-500">
          <FileText className="h-3 w-3 mr-1" />
          Step {currentStep} of 3
        </Badge>
      </div>
    </div>
  );
};

export default CheckoutPageHeader;
