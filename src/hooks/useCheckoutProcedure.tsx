
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CheckoutReportAPI } from '@/lib/api/reports/checkoutReportApi';
import { CheckoutData, CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { parseReportInfo } from '@/lib/api/reports/reportTransformers';

export interface UseCheckoutProcedureProps {
  checkinReport: Report | null;
}

export const useCheckoutProcedure = ({ checkinReport }: UseCheckoutProcedureProps) => {
  const { toast } = useToast();
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [comparisons, setComparisons] = useState<CheckoutComparison[]>([]);
  const [isLoadingComparisons, setIsLoadingComparisons] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  /**
   * Phase 2: Start checkout session within check-in report
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

    console.log('Starting checkout session...', {
      checkinReportId: checkinReport.id,
      checkoutData
    });
    
    setIsCreatingCheckout(true);
    
    try {
      const checkoutSessionData = await CheckoutReportAPI.createBasicCheckoutReport(
        checkinReport.id,
        checkoutData
      );

      if (checkoutSessionData) {
        console.log('Checkout session started:', checkoutSessionData);
        setCheckoutSession(checkoutSessionData);
        setCurrentStep(2);
        
        toast({
          title: "Checkout Started",
          description: "Checkout session started successfully. Ready for component setup.",
        });
      } else {
        throw new Error('Failed to start checkout session');
      }
    } catch (error) {
      console.error('Error starting checkout session:', error);
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
   * Phase 3: Initialize component comparisons
   */
  const initializeComparisons = async () => {
    if (!checkoutSession || !checkinReport) {
      console.error('Missing required data for initialization:', { checkoutSession, checkinReport });
      return;
    }

    console.log('Starting component initialization...', {
      checkoutSessionId: checkoutSession.id,
      checkinReportId: checkinReport.id
    });

    setIsLoadingComparisons(true);
    try {
      console.log('Initializing component comparisons...');
      
      const comparisonData = await CheckoutReportAPI.initializeComponentComparisons(
        checkoutSession.id,
        checkinReport.id
      );

      console.log('Components initialized:', comparisonData);
      
      setComparisons(comparisonData);
      setCurrentStep(3);
      
      toast({
        title: "Components Initialized",
        description: `Setup complete! ${comparisonData.length} components ready for comparison.`,
      });
      
      console.log('Component comparisons initialized successfully:', {
        comparisonsCreated: comparisonData.length
      });
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
   * Load existing checkout session if it exists
   */
  const loadExistingCheckout = async () => {
    if (!checkinReport) return;

    try {
      const { data: report, error } = await supabase
        .from('inspections')
        .select('report_info')
        .eq('id', checkinReport.id)
        .single();

      if (error) throw error;

      const reportInfo = parseReportInfo(report.report_info);
      
      if (reportInfo.checkout_session) {
        console.log('Found existing checkout session:', reportInfo.checkout_session);
        setCheckoutSession(reportInfo.checkout_session);
        
        if (reportInfo.checkout_session.comparisons) {
          setComparisons(reportInfo.checkout_session.comparisons);
          setCurrentStep(3);
        } else if (reportInfo.checkout_session.components_initialized) {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      }
    } catch (error) {
      console.error('Error loading existing checkout session:', error);
    }
  };

  /**
   * Complete the checkout procedure
   */
  const completeCheckout = async () => {
    if (!checkinReport) return;

    try {
      console.log('Completing checkout session for report:', checkinReport.id);
      await CheckoutReportAPI.completeCheckoutReport(checkinReport.id);
      
      setCheckoutSession(prev => prev ? { ...prev, status: 'completed' } : prev);
      
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
    checkoutReport: checkoutSession, // For backward compatibility
    checkoutSession,
    isCreatingCheckout,
    comparisons,
    isLoadingComparisons,
    currentStep,
    createBasicCheckout,
    initializeComparisons,
    completeCheckout,
    loadExistingCheckout,
    setComparisons
  };
};
