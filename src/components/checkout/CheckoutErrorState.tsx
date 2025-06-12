
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

interface CheckoutErrorStateProps {
  error: string;
}

const CheckoutErrorState = ({ error }: CheckoutErrorStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Report</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested report could not be found.'}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/reports')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutErrorState;
