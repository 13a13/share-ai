
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Report } from '@/types';

interface CheckoutButtonProps {
  report: Report;
  className?: string;
}

const CheckoutButton = ({ report, className }: CheckoutButtonProps) => {
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    navigate(`/reports/${report.id}/checkout`);
  };

  return (
    <Button 
      onClick={handleCheckoutClick}
      className={className}
      variant="outline"
    >
      <CheckSquare className="h-4 w-4 mr-2" />
      Start Checkout
    </Button>
  );
};

export default CheckoutButton;
