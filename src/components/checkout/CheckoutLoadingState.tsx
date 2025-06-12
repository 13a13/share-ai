
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';

const CheckoutLoadingState = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading checkout page...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutLoadingState;
