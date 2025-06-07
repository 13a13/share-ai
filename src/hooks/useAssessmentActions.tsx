import { useState } from 'react';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { CheckoutComparisonAPI } from '@/lib/api/reports/checkoutComparisonApi';
import { useToast } from '@/components/ui/use-toast';

interface UseAssessmentActionsProps {
  onComparisonUpdate: (updatedComparison: CheckoutComparison) => void;
}

export const useAssessmentActions = ({ onComparisonUpdate }: UseAssessmentActionsProps) => {
  const { toast } = useToast();
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [changeDescriptions, setChangeDescriptions] = useState<Record<string, string>>({});

  const handleStatusChange = async (
    comparisonId: string, 
    status: 'unchanged' | 'changed', 
    changeDescription?: string
  ) => {
    setIsUpdating(prev => ({ ...prev, [comparisonId]: true }));
    
    try {
      const updatedComparison = await CheckoutComparisonAPI.updateCheckoutComparison(
        comparisonId,
        { 
          status, 
          change_description: changeDescription || null,
          updated_at: new Date().toISOString()
        }
      );

      if (updatedComparison) {
        onComparisonUpdate(updatedComparison);
        toast({
          title: "Assessment Updated",
          description: `Component marked as ${status === 'unchanged' ? 'no changes' : 'changed'}`,
        });
        
        // Collapse the component if marked as unchanged
        if (status === 'unchanged') {
          setExpandedComponent(null);
        }
      }
    } catch (error) {
      console.error('Error updating comparison:', error);
      toast({
        title: "Error",
        description: "Failed to update assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(prev => ({ ...prev, [comparisonId]: false }));
    }
  };

  const handleDescriptionSave = async (comparisonId: string, description: string) => {
    if (description && description.trim()) {
      await handleStatusChange(comparisonId, 'changed', description.trim());
    }
  };

  const handleImagesProcessed = async (
    comparisonId: string,
    imageUrls: string[],
    result: any
  ) => {
    setIsUpdating(prev => ({ ...prev, [comparisonId]: true }));
    
    try {
      const updatedComparison = await CheckoutComparisonAPI.updateCheckoutComparison(
        comparisonId,
        { 
          checkout_images: imageUrls,
          checkout_condition: result.description || '',
          status: 'changed',
          change_description: result.notes || 'Images added during checkout',
          ai_analysis: result,
          updated_at: new Date().toISOString()
        }
      );

      if (updatedComparison) {
        onComparisonUpdate(updatedComparison);
        toast({
          title: "Photos Added",
          description: "Checkout photos have been processed and saved.",
        });
      }
    } catch (error) {
      console.error('Error saving checkout images:', error);
      toast({
        title: "Error",
        description: "Failed to save checkout photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(prev => ({ ...prev, [comparisonId]: false }));
    }
  };

  const toggleExpanded = (comparisonId: string) => {
    setExpandedComponent(expandedComponent === comparisonId ? null : comparisonId);
  };

  const handleDescriptionChange = (comparisonId: string, description: string) => {
    setChangeDescriptions(prev => ({ ...prev, [comparisonId]: description }));
  };

  return {
    expandedComponent,
    setExpandedComponent,
    isUpdating,
    setIsUpdating,
    changeDescriptions,
    setChangeDescriptions,
    handleStatusChange,
    handleDescriptionSave,
    handleImagesProcessed,
    toggleExpanded,
    handleDescriptionChange
  };
};
