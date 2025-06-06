
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
  const [currentStep, setCurrentStep] = useState(1);

  /**
   * Phase 2: Create basic checkout report
   */
  const createBasicCheckout = async (checkoutData: CheckoutData) => {
    if (!checkinReport) {
      console.error('No check-in report found');
      toast({
        title: "Error",
        description: "No check-in report found to create checkout from.",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating basic checkout...');
    setIsCreatingCheckout(true);
    
    try {
      const newCheckoutReport = await CheckoutReportAPI.createBasicCheckoutReport(
        checkinReport.id,
        checkoutData
      );

      if (newCheckoutReport) {
        console.log('Basic checkout report created:', newCheckoutReport);
        setCheckoutReport(newCheckoutReport);
        setCurrentStep(2);
        
        toast({
          title: "Checkout Created",
          description: "Basic checkout record created successfully. Ready for component setup.",
        });
      } else {
        throw new Error('Failed to create basic checkout report');
      }
    } catch (error) {
      console.error('Error creating basic checkout:', error);
      toast({
        title: "Error",
        description: `Failed to create checkout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  /**
   * Phase 3: Initialize component comparisons
   */
  const initializeComparisons = async () => {
    if (!checkoutReport || !checkinReport) return;

    setIsLoadingComparisons(true);
    try {
      console.log('Initializing component comparisons...');
      
      const components = await CheckoutReportAPI.initializeComponentComparisons(
        checkoutReport.id,
        checkinReport.id
      );

      // Load the created comparison records
      const comparisonData = await CheckoutComparisonAPI.getCheckoutComparisons(checkoutReport.id);
      setComparisons(comparisonData);
      setCurrentStep(3);
      
      toast({
        title: "Components Initialized",
        description: `Setup complete! ${components.length} components ready for comparison.`,
      });
      
      console.log('Component comparisons initialized:', comparisonData.length);
    } catch (error) {
      console.error('Error initializing comparisons:', error);
      toast({
        title: "Error",
        description: "Failed to initialize component comparisons.",
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
    currentStep,
    createBasicCheckout,
    initializeComparisons,
    completeCheckout,
    setComparisons // Export this so components can update comparisons
  };
};
