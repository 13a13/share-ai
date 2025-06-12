
import { useCallback } from 'react';
import { CheckoutOperations } from '@/lib/api/reports/checkoutOperations';
import { CheckoutData, CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { useToast } from '@/components/ui/use-toast';
import { Report } from '@/types';

interface UseCheckoutOperationsProps {
  checkinReport: Report | null;
  setCheckoutData: (data: CheckoutData | null) => void;
  setCheckoutComponents: (components: any[]) => void;
  setCurrentStep: (step: number) => void;
  setIsCreatingCheckout: (creating: boolean) => void;
  setIsLoadingComparisons: (loading: boolean) => void;
  setComparisons: (comparisons: CheckoutComparison[]) => void;
  setIsDraftSaved: (saved: boolean) => void;
  saveDraft: (data: CheckoutData, comps: CheckoutComparison[], step: number) => Promise<void>;
  clearDraft: () => Promise<void>;
  checkoutData: CheckoutData | null;
  comparisons: CheckoutComparison[];
  currentStep: number;
  checkoutComponents: any[];
}

export const useCheckoutOperations = ({
  checkinReport,
  setCheckoutData,
  setCheckoutComponents,
  setCurrentStep,
  setIsCreatingCheckout,
  setIsLoadingComparisons,
  setComparisons,
  setIsDraftSaved,
  saveDraft,
  clearDraft,
  checkoutData,
  comparisons,
  currentStep,
  checkoutComponents
}: UseCheckoutOperationsProps) => {
  const { toast } = useToast();

  const startCheckoutProcess = useCallback(async (formData: CheckoutData) => {
    if (!checkinReport) {
      console.error('No check-in report found');
      toast({
        title: "Error",
        description: "No check-in report found to create checkout from.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting checkout process...', formData);
    
    setIsCreatingCheckout(true);
    
    try {
      const components = await CheckoutOperations.prepareCheckoutComponents(checkinReport.id);
      
      setCheckoutData(formData);
      setCheckoutComponents(components);
      setCurrentStep(2);
      
      await saveDraft(formData, [], 2);
      
      toast({
        title: "Checkout Started",
        description: "Checkout process initiated. Ready for component assessment.",
      });
    } catch (error) {
      console.error('Error starting checkout process:', error);
      toast({
        title: "Error",
        description: `Failed to start checkout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  }, [checkinReport, setCheckoutData, setCheckoutComponents, setCurrentStep, setIsCreatingCheckout, saveDraft, toast]);

  const initializeAssessments = useCallback(async () => {
    if (!checkinReport || !checkoutData) {
      console.error('Missing required data for initialization');
      return;
    }

    setIsLoadingComparisons(true);
    try {
      const initialComparisons: CheckoutComparison[] = checkoutComponents.map((component, index) => ({
        id: `temp_${index}`,
        checkout_report_id: 'pending',
        checkin_report_id: checkinReport.id,
        room_id: component.roomId || 'general',
        component_id: component.id,
        component_name: component.name,
        status: 'pending' as const,
        ai_analysis: {
          checkinData: {
            originalCondition: component.condition,
            originalDescription: component.description,
            originalImages: component.images || [],
            timestamp: component.timestamp
          }
        },
        checkout_images: [],
        change_description: null,
        checkout_condition: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      setComparisons(initialComparisons);
      setCurrentStep(3);
      
      await saveDraft(checkoutData, initialComparisons, 3);
      
      toast({
        title: "Components Ready",
        description: `${initialComparisons.length} components ready for assessment.`,
      });
    } catch (error) {
      console.error('Error initializing assessments:', error);
      toast({
        title: "Error",
        description: "Failed to initialize component assessments.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComparisons(false);
    }
  }, [checkinReport, checkoutData, checkoutComponents, setComparisons, setCurrentStep, setIsLoadingComparisons, saveDraft, toast]);

  const completeCheckout = useCallback(async () => {
    if (!checkinReport || !checkoutData) {
      console.error('Missing required data for completion');
      return;
    }

    try {
      console.log('Completing checkout process...');
      
      const finalCheckoutReport = await CheckoutOperations.createCompletedCheckoutReport(
        checkinReport.id,
        checkoutData,
        comparisons
      );
      
      await clearDraft();
      setIsDraftSaved(false);
      
      toast({
        title: "Checkout Completed",
        description: "The checkout report has been created and saved successfully.",
      });

      console.log('Checkout completed successfully:', finalCheckoutReport);
      return finalCheckoutReport;
    } catch (error) {
      console.error('Error completing checkout:', error);
      toast({
        title: "Error",
        description: "Failed to complete checkout. Please try again.",
        variant: "destructive",
      });
    }
  }, [checkinReport, checkoutData, comparisons, clearDraft, setIsDraftSaved, toast]);

  return {
    startCheckoutProcess,
    initializeAssessments,
    completeCheckout
  };
};
