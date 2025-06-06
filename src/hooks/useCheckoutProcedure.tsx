
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CheckoutReportAPI } from '@/lib/api/reports/checkoutReportApi';
import { CheckoutData } from '@/lib/api/reports/checkoutTypes';
import { Report } from '@/types';

export interface UseCheckoutProcedureProps {
  checkinReport: Report | null;
}

export const useCheckoutProcedure = ({ checkinReport }: UseCheckoutProcedureProps) => {
  const { toast } = useToast();
  const [checkoutReport, setCheckoutReport] = useState<any>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  /**
   * Simple checkout procedure - Step 1
   */
  const startCheckoutProcedure = async (checkoutData: CheckoutData) => {
    if (!checkinReport) {
      console.error('No check-in report found');
      toast({
        title: "Error",
        description: "No check-in report found to create checkout from.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting simple checkout procedure...');
    console.log('Check-in report:', checkinReport.id);
    console.log('Checkout data:', checkoutData);
    
    setIsCreatingCheckout(true);
    
    try {
      // Create the checkout report
      const newCheckoutReport = await CheckoutReportAPI.createCheckoutReport(
        checkinReport.id,
        checkoutData
      );

      if (newCheckoutReport) {
        console.log('Checkout report created successfully:', newCheckoutReport);
        setCheckoutReport(newCheckoutReport);
        
        toast({
          title: "Checkout Started",
          description: "Basic checkout procedure has been initiated successfully.",
        });
      } else {
        throw new Error('Failed to create checkout report');
      }
    } catch (error) {
      console.error('Error starting checkout procedure:', error);
      toast({
        title: "Error",
        description: `Failed to start checkout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  /**
   * Complete the checkout procedure
   */
  const completeCheckout = async () => {
    if (!checkoutReport) return;

    try {
      console.log('Completing checkout report:', checkoutReport.id);
      await CheckoutReportAPI.completeCheckoutReport(checkoutReport.id);
      
      setCheckoutReport(prev => prev ? { ...prev, status: 'completed' } : prev);
      
      toast({
        title: "Checkout Completed",
        description: "The checkout procedure has been completed successfully.",
      });
    } catch (error) {
      console.error('Error completing checkout:', error);
      toast({
        title: "Error",
        description: "Failed to complete checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    checkoutReport,
    isCreatingCheckout,
    startCheckoutProcedure,
    completeCheckout
  };
};
