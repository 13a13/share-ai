
import { useState } from 'react';
import { CheckoutData, CheckoutComparison } from '@/lib/api/reports/checkoutTypes';

export interface CheckoutState {
  checkoutData: CheckoutData | null;
  isCreatingCheckout: boolean;
  comparisons: CheckoutComparison[];
  isLoadingComparisons: boolean;
  currentStep: number;
  isDraftSaved: boolean;
  checkoutComponents: any[];
}

export const useCheckoutState = () => {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [comparisons, setComparisons] = useState<CheckoutComparison[]>([]);
  const [isLoadingComparisons, setIsLoadingComparisons] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [checkoutComponents, setCheckoutComponents] = useState<any[]>([]);

  const updateComparison = (updatedComparison: CheckoutComparison) => {
    setComparisons(prev => 
      prev.map(comp => 
        comp.id === updatedComparison.id ? updatedComparison : comp
      )
    );
  };

  return {
    // State values
    checkoutData,
    isCreatingCheckout,
    comparisons,
    isLoadingComparisons,
    currentStep,
    isDraftSaved,
    checkoutComponents,
    
    // State setters
    setCheckoutData,
    setIsCreatingCheckout,
    setComparisons,
    setIsLoadingComparisons,
    setCurrentStep,
    setIsDraftSaved,
    setCheckoutComponents,
    
    // Computed operations
    updateComparison
  };
};
