
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CheckoutReportAPI, CheckoutComparisonAPI } from '@/lib/api/reports/checkoutApi';
import { CheckoutData, CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { Report } from '@/types';

export interface UseCheckoutProcedureProps {
  checkinReport: Report | null;
}

export const useCheckoutProcedure = ({ checkinReport }: UseCheckoutProcedureProps) => {
  const { toast } = useToast();
  const [checkoutReport, setCheckoutReport] = useState<any>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [comparisons, setComparisons] = useState<CheckoutComparison[]>([]);
  const [isLoadingComparisons, setIsLoadingComparisons] = useState(false);

  /**
   * Step 1: Create checkout report with component comparisons
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

    console.log('Starting checkout procedure...');
    console.log('Check-in report:', checkinReport.id);
    console.log('Checkout data:', checkoutData);
    
    setIsCreatingCheckout(true);
    
    try {
      // Create the checkout report with component comparisons
      const newCheckoutReport = await CheckoutReportAPI.createCheckoutReport(
        checkinReport.id,
        checkoutData
      );

      if (newCheckoutReport) {
        console.log('Checkout report created successfully:', newCheckoutReport);
        setCheckoutReport(newCheckoutReport);
        
        // Load the comparisons that were just created
        await loadComparisons(newCheckoutReport.id);
        
        toast({
          title: "Checkout Started",
          description: `Checkout procedure initiated with ${newCheckoutReport.componentsCount || 0} components to compare.`,
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
   * Step 2: Load component comparisons
   */
  const loadComparisons = async (checkoutReportId: string) => {
    setIsLoadingComparisons(true);
    try {
      const comparisonData = await CheckoutComparisonAPI.getCheckoutComparisons(checkoutReportId);
      setComparisons(comparisonData);
      console.log('Loaded comparisons:', comparisonData.length);
    } catch (error) {
      console.error('Error loading comparisons:', error);
      toast({
        title: "Error",
        description: "Failed to load component comparisons.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComparisons(false);
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
    comparisons,
    isLoadingComparisons,
    startCheckoutProcedure,
    loadComparisons,
    completeCheckout
  };
};
