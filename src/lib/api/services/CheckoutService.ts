/**
 * CheckoutService - Business logic for checkout comparison workflow
 * Consolidates: checkoutReportApi.ts, checkoutComparisonApi.ts, checkoutOperations.ts
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from '../repositories/BaseRepository';
import { CheckoutMapper } from '../mappers/CheckoutMapper';
import { CheckoutComparison, CheckoutData } from '../reports/checkoutTypes';
import { CheckoutOperations } from '../reports/checkoutOperations';
import { CheckoutComponentExtractor } from '../reports/checkoutComponentExtractor';
import { NotFoundError } from '../errors/ApiErrors';

export class CheckoutService extends BaseRepository {
  /**
   * Create a completed checkout report
   */
  async createComparisonReport(
    checkinReportId: string,
    checkoutData: CheckoutData,
    assessmentData: any[]
  ): Promise<any> {
    return await this.executeMutation(
      async () => {
        const result = await CheckoutOperations.createCompletedCheckoutReport(
          checkinReportId,
          checkoutData,
          assessmentData
        );
        return { data: result, error: null };
      },
      'CheckoutService.createComparisonReport'
    );
  }

  /**
   * Get checkout comparisons for a checkout report
   */
  async getComparisons(checkoutReportId: string): Promise<CheckoutComparison[]> {
    const data = await this.executeQuery<any[]>(
      async () => await supabase
        .from('checkout_comparisons')
        .select('*')
        .eq('checkout_report_id', checkoutReportId)
        .order('created_at', { ascending: true }),
      'CheckoutService.getComparisons'
    );
    
    return CheckoutMapper.toComparisonModels(data);
  }

  /**
   * Update a checkout comparison
   */
  async updateComparison(id: string, updates: Partial<CheckoutComparison>): Promise<void> {
    const dbUpdates = CheckoutMapper.toDatabaseUpdate(updates);
    
    await this.executeMutation<any>(
      async () => await supabase
        .from('checkout_comparisons')
        .update(dbUpdates)
        .eq('id', id),
      'CheckoutService.updateComparison'
    );
  }

  /**
   * Save checkout draft to localStorage
   */
  async saveDraft(reportId: string, draft: any): Promise<void> {
    return CheckoutOperations.saveDraftCheckout(reportId, draft);
  }

  /**
   * Load checkout draft from localStorage
   */
  async loadDraft(reportId: string): Promise<any | null> {
    return CheckoutOperations.loadDraftCheckout(reportId);
  }

  /**
   * Clear checkout draft from localStorage
   */
  async clearDraft(reportId: string): Promise<void> {
    return CheckoutOperations.clearDraftCheckout(reportId);
  }

  /**
   * Prepare components for checkout assessment
   */
  async prepareCheckoutComponents(checkinReportId: string): Promise<any[]> {
    return CheckoutOperations.prepareCheckoutComponents(checkinReportId);
  }

  /**
   * Extract components from check-in report
   */
  extractComponentsFromCheckinReport(report: any): any[] {
    return CheckoutComponentExtractor.extractComponentsFromCheckinReport(report);
  }

  /**
   * Process component data for checkout
   */
  processComponentData(component: any, index: number, roomId: string, roomName: string): any {
    return CheckoutComponentExtractor.processComponentData(component, index, roomId, roomName);
  }

  /**
   * Extract component images
   */
  extractComponentImages(component: any): string[] {
    return CheckoutComponentExtractor.extractComponentImages(component);
  }
}

// Singleton instance
export const checkoutService = new CheckoutService();
