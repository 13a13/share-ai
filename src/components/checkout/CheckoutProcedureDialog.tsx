
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CheckSquare, Clock } from 'lucide-react';
import { Report } from '@/types';
import { CheckoutData } from '@/lib/api/reports/checkoutApi';

interface CheckoutProcedureDialogProps {
  checkinReport: Report;
  onStartCheckout: (checkoutData: CheckoutData) => void;
  isCreating: boolean;
  children: React.ReactNode;
}

const CheckoutProcedureDialog = ({
  checkinReport,
  onStartCheckout,
  isCreating,
  children
}: CheckoutProcedureDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CheckoutData>({
    clerk: '',
    tenantName: '',
    tenantPresent: false,
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCheckout(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            Start Checkout Procedure
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Property:</strong> {checkinReport.property?.name || 'Unknown Property'}
            </p>
            <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Check-in Date: {new Date(checkinReport.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="checkout-date">Checkout Date</Label>
              <Input
                id="checkout-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="clerk">Clerk/Inspector Name</Label>
              <Input
                id="clerk"
                value={formData.clerk}
                onChange={(e) => setFormData({ ...formData, clerk: e.target.value })}
                placeholder="Enter clerk or inspector name"
              />
            </div>

            <div>
              <Label htmlFor="tenant-name">Tenant Name</Label>
              <Input
                id="tenant-name"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                placeholder="Enter tenant name"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tenant-present"
                checked={formData.tenantPresent}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, tenantPresent: checked === true })
                }
              />
              <Label htmlFor="tenant-present">Tenant present during checkout</Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Starting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Start Checkout
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutProcedureDialog;
