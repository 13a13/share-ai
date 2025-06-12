
import { useEffect } from 'react';
import { Report } from '@/types';
import { useCheckoutState } from './useCheckoutState';
import { useCheckoutDraft } from './useCheckoutDraft';
import { useCheckoutOperations } from './useCheckoutOperations';

export interface UseCheckoutProcedureProps {
  checkinReport: Report | null;
}

export const useCheckoutProcedure = ({ checkinReport }: UseCheckoutProcedureProps) => {
  const {
    checkoutData,
    isCreatingCheckout,
    comparisons,
    isLoadingComparisons,
    currentStep,
    isDraftSaved,
    checkoutComponents,
    setCheckoutData,
    setIsCreatingCheckout,
    setComparisons,
    setIsLoadingComparisons,
    setCurrentStep,
    setIsDraftSaved,
    setCheckoutComponents,
    updateComparison
  } = useCheckoutState();

  const { loadDraft, saveDraft, clearDraft } = useCheckoutDraft({
    checkinReportId: checkinReport?.id || null,
    setCheckoutData,
    setComparisons,
    setCurrentStep,
    setIsDraftSaved,
    checkoutComponents
  });

  const { startCheckoutProcess, initializeAssessments, completeCheckout } = useCheckoutOperations({
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
  });

  // Load any existing draft on mount
  useEffect(() => {
    if (checkinReport) {
      loadDraft();
    }
  }, [checkinReport, loadDraft]);

  // Enhanced updateComparison with auto-save
  const updateComparisonWithSave = (updatedComparison: any) => {
    updateComparison(updatedComparison);
    
    // Auto-save draft when comparisons change
    if (checkoutData) {
      const updatedComparisons = comparisons.map(comp => 
        comp.id === updatedComparison.id ? updatedComparison : comp
      );
      saveDraft(checkoutData, updatedComparisons, currentStep);
    }
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
    updateComparison: updateComparisonWithSave,
    setComparisons
  };
};
