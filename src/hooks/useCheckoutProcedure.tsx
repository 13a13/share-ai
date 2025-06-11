
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CheckoutReportAPI, CheckoutComparisonAPI } from '@/lib/api/reports/checkoutApi';
import { CheckoutData, CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { CheckoutOperations } from '@/lib/api/reports/checkoutOperations';
import { Report } from '@/types';

export interface UseCheckoutProcedureProps {
  checkinReport: Report | null;
}

export const useCheckoutProcedure = ({ checkinReport }: UseCheckoutProcedureProps) => {
  const { toast } = useToast();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [comparisons, setComparisons] = useState<CheckoutComparison[]>([]);
  const [isLoadingComparisons, setIsLoadingComparisons] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [checkoutComponents, setCheckoutComponents] = useState<any[]>([]);

  // Load any existing draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (checkinReport) {
        const draft = await CheckoutOperations.loadDraftCheckout(checkinReport.id);
        if (draft) {
          setCheckoutData(draft.checkoutData || null);
          setComparisons(draft.comparisons || []);
          setCurrentStep(draft.currentStep || 1);
          setIsDraftSaved(true);
          
          toast({
            title: "Draft Loaded",
            description: "Your previous checkout progress has been restored.",
          });
        }
      }
    };
    
    loadDraft();
  }, [checkinReport, toast]);

  /**
   * Start checkout process (Step 1 → Step 2)
   */
  const startCheckoutProcess = async (formData: CheckoutData) => {
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
      // Prepare components for assessment
      const components = await CheckoutOperations.prepareCheckoutComponents(checkinReport.id);
      
      setCheckoutData(formData);
      setCheckoutComponents(components);
      setCurrentStep(2);
      
      // Save draft
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
  };

  /**
   * Initialize component assessments (Step 2 → Step 3)
   */
  const initializeAssessments = async () => {
    if (!checkinReport || !checkoutData) {
      console.error('Missing required data for initialization');
      return;
    }

    setIsLoadingComparisons(true);
    try {
      // Create comparison objects for UI (in memory only)
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
      
      // Save draft
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
  };

  /**
   * Complete the checkout process - create final report
   */
  const completeCheckout = async () => {
    if (!checkinReport || !checkoutData) {
      console.error('Missing required data for completion');
      return;
    }

    try {
      console.log('Completing checkout process...');
      
      // Create the final checkout report with all assessment data
      const finalCheckoutReport = await CheckoutOperations.createCompletedCheckoutReport(
        checkinReport.id,
        checkoutData,
        comparisons
      );
      
      // Clear draft data
      await CheckoutOperations.clearDraftCheckout(checkinReport.id);
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
  };

  /**
   * Save draft progress
   */
  const saveDraft = async (data: CheckoutData, comps: CheckoutComparison[], step: number) => {
    if (!checkinReport) return;
    
    const draftData = {
      checkoutData: data,
      comparisons: comps,
      currentStep: step,
      components: checkoutComponents
    };
    
    await CheckoutOperations.saveDraftCheckout(checkinReport.id, draftData);
    setIsDraftSaved(true);
  };

  /**
   * Update a comparison assessment
   */
  const updateComparison = (updatedComparison: CheckoutComparison) => {
    setComparisons(prev => {
      const updated = prev.map(comp => 
        comp.id === updatedComparison.id ? updatedComparison : comp
      );
      
      // Auto-save draft when comparisons change
      if (checkoutData) {
        saveDraft(checkoutData, updated, currentStep);
      }
      
      return updated;
    });
  };

  return {
    checkoutData,
    isCreatingCheckout,
    comparisons,
    isLoadingComparisons,
    currentStep,
    isDraftSaved,
    startCheckoutProcess,
    initializeAssessments,
    completeCheckout,
    updateComparison,
    setComparisons
  };
};
