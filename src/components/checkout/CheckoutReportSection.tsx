
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, User, Calendar } from 'lucide-react';

interface CheckoutReportSectionProps {
  checkoutSession: any;
}

const CheckoutReportSection = ({ checkoutSession }: CheckoutReportSectionProps) => {
  if (!checkoutSession) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-shareai-blue flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Checkout Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Checkout Date</p>
              <p className="font-semibold">
                {checkoutSession.checkout_date 
                  ? new Date(checkoutSession.checkout_date).toLocaleDateString()
                  : 'Not set'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Checkout Clerk</p>
              <p className="font-semibold">{checkoutSession.checkout_clerk || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Tenant</p>
              <p className="font-semibold">{checkoutSession.checkout_tenant_name || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              {getStatusBadge(checkoutSession.status)}
            </div>
          </div>
        </div>

        {checkoutSession.checkout_tenant_present !== undefined && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Tenant Present</p>
            <p className="font-semibold">
              {checkoutSession.checkout_tenant_present ? 'Yes' : 'No'}
            </p>
          </div>
        )}

        {checkoutSession.comparisons && checkoutSession.comparisons.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Component Assessments</h3>
            <div className="space-y-2">
              {checkoutSession.comparisons.map((comparison: any) => (
                <div key={comparison.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{comparison.component_name}</p>
                    {comparison.change_description && (
                      <p className="text-sm text-gray-600">{comparison.change_description}</p>
                    )}
                  </div>
                  <Badge 
                    variant={comparison.status === 'completed' ? 'default' : 'secondary'}
                    className={
                      comparison.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {comparison.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {checkoutSession.status === 'in_progress' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">
              <Clock className="h-4 w-4 inline mr-1" />
              Checkout is currently in progress. Last updated: {' '}
              {checkoutSession.last_updated 
                ? new Date(checkoutSession.last_updated).toLocaleString()
                : 'Unknown'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckoutReportSection;
