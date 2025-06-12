
import { useCallback } from 'react';
import { CheckoutOperations } from '@/lib/api/reports/checkoutOperations';
import { CheckoutData, CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { useToast } from '@/components/ui/use-toast';

interface UseCheckoutDraftProps {
  checkinReportId: string | null;
  setCheckoutData: (data: CheckoutData | null) => void;
  setComparisons: (comparisons: CheckoutComparison[]) => void;
  setCurrentStep: (step: number) => void;
  setIsDraftSaved: (saved: boolean) => void;
  checkoutComponents: any[];
}

export const useCheckoutDraft = ({
  checkinReportId,
  setCheckoutData,
  setComparisons,
  setCurrentStep,
  setIsDraftSaved,
  checkoutComponents
}: UseCheckoutDraftProps) => {
  const { toast } = useToast();

  const loadDraft = useCallback(async () => {
    if (!checkinReportId) return;
    
    const draft = await CheckoutOperations.loadDraftCheckout(checkinReportId);
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
  }, [checkinReportId, setCheckoutData, setComparisons, setCurrentStep, setIsDraftSaved, toast]);

  const saveDraft = useCallback(async (
    data: CheckoutData, 
    comps: CheckoutComparison[], 
    step: number
  ) => {
    if (!checkinReportId) return;
    
    const draftData = {
      checkoutData: data,
      comparisons: comps,
      currentStep: step,
      components: checkoutComponents
    };
    
    await CheckoutOperations.saveDraftCheckout(checkinReportId, draftData);
    setIsDraftSaved(true);
  }, [checkinReportId, checkoutComponents, setIsDraftSaved]);

  const clearDraft = useCallback(async () => {
    if (!checkinReportId) return;
    
    await CheckoutOperations.clearDraftCheckout(checkinReportId);
    setIsDraftSaved(false);
  }, [checkinReportId, setIsDraftSaved]);

  return {
    loadDraft,
    saveDraft,
    clearDraft
  };
};
