
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CheckoutAPI, CheckoutData, CheckoutComparison } from '@/lib/api/reports/checkoutApi';
import { Report, RoomComponent } from '@/types';

export interface UseCheckoutProcedureProps {
  checkinReport: Report | null;
}

export const useCheckoutProcedure = ({ checkinReport }: UseCheckoutProcedureProps) => {
  const { toast } = useToast();
  const [checkoutReport, setCheckoutReport] = useState<Report | null>(null);
  const [comparisons, setComparisons] = useState<CheckoutComparison[]>([]);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isLoadingComparisons, setIsLoadingComparisons] = useState(false);

  /**
   * Start the checkout procedure
   */
  const startCheckoutProcedure = async (checkoutData: CheckoutData) => {
    if (!checkinReport) {
      toast({
        title: "Error",
        description: "No check-in report found to create checkout from.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCheckout(true);
    
    try {
      // Create the checkout report
      const newCheckoutReport = await CheckoutAPI.createCheckoutReport(
        checkinReport.id,
        checkoutData
      );

      if (newCheckoutReport) {
        setCheckoutReport(newCheckoutReport);

        // Collect all components from all rooms in the check-in report
        const allComponents: (RoomComponent & { roomId: string })[] = [];
        checkinReport.rooms.forEach(room => {
          if (room.components) {
            room.components.forEach(component => {
              allComponents.push({
                ...component,
                roomId: room.id
              });
            });
          }
        });

        // Initialize checkout comparisons
        await CheckoutAPI.initializeCheckoutComparisons(
          newCheckoutReport.id,
          checkinReport.id,
          allComponents
        );

        // Load the created comparisons
        await loadCheckoutComparisons(newCheckoutReport.id);

        toast({
          title: "Checkout Started",
          description: "Checkout procedure has been initiated. You can now review each component.",
        });
      }
    } catch (error) {
      console.error('Error starting checkout procedure:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout procedure. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  /**
   * Load checkout comparisons
   */
  const loadCheckoutComparisons = async (checkoutReportId: string) => {
    setIsLoadingComparisons(true);
    
    try {
      const fetchedComparisons = await CheckoutAPI.getCheckoutComparisons(checkoutReportId);
      setComparisons(fetchedComparisons);
    } catch (error) {
      console.error('Error loading checkout comparisons:', error);
      toast({
        title: "Error",
        description: "Failed to load checkout comparisons.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComparisons(false);
    }
  };

  /**
   * Update a checkout comparison
   */
  const updateComparison = async (
    comparisonId: string,
    updates: Partial<CheckoutComparison>
  ) => {
    try {
      const updatedComparison = await CheckoutAPI.updateCheckoutComparison(
        comparisonId,
        updates
      );

      if (updatedComparison) {
        setComparisons(prev => 
          prev.map(comp => 
            comp.id === comparisonId ? updatedComparison : comp
          )
        );

        toast({
          title: "Updated",
          description: "Comparison has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating comparison:', error);
      toast({
        title: "Error",
        description: "Failed to update comparison. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Complete the checkout procedure
   */
  const completeCheckout = async () => {
    if (!checkoutReport) return;

    try {
      await CheckoutAPI.completeCheckoutReport(checkoutReport.id);
      
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
    comparisons,
    isCreatingCheckout,
    isLoadingComparisons,
    startCheckoutProcedure,
    loadCheckoutComparisons,
    updateComparison,
    completeCheckout
  };
};
