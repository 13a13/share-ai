import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RoomComponent } from "@/types";

/**
 * Direct component saving hook - single source of truth for component saves
 * Bypasses all intermediate layers and saves directly to the database
 */
export const useDirectComponentSaving = () => {
  const { toast } = useToast();

  const saveComponentDirectly = useCallback(async (
    reportId: string,
    roomId: string,
    componentId: string,
    updatedComponent: Partial<RoomComponent>
  ): Promise<boolean> => {
    console.log(`🎯 DirectSave: Starting direct save for component ${componentId} in room ${roomId} of report ${reportId}`);
    console.log(`🎯 DirectSave: Component updates:`, updatedComponent);

    try {
      // Get the current inspection data
      const { data: inspection, error: fetchError } = await supabase
        .from('inspections')
        .select('id, report_info, room_id')
        .eq('room_id', roomId)
        .single();

      if (fetchError) {
        console.error(`❌ DirectSave: Failed to fetch inspection for room ${roomId}:`, fetchError);
        throw fetchError;
      }

      console.log(`🎯 DirectSave: Found inspection ${inspection.id} for room ${roomId}`);

      // Get current report_info, ensuring it's an object
      const currentReportInfo = inspection.report_info && typeof inspection.report_info === 'object' 
        ? inspection.report_info 
        : {};

      // Get current components array, handling the Json type from Supabase
      const currentComponents = Array.isArray((currentReportInfo as any).components) 
        ? (currentReportInfo as any).components 
        : [];

      console.log(`🎯 DirectSave: Current components count: ${currentComponents.length}`);

      // Find and update the specific component
      let componentFound = false;
      const updatedComponents = currentComponents.map((comp: any) => {
        if (comp.id === componentId) {
          componentFound = true;
          const updated = {
            ...comp,
            ...updatedComponent,
            // Ensure core fields are preserved
            id: componentId,
            name: comp.name,
            type: comp.type,
            isOptional: comp.isOptional,
            isCustom: comp.isCustom,
            // Save analysis data in the correct structure
            description: updatedComponent.description || comp.description || '',
            conditionSummary: updatedComponent.conditionSummary || comp.conditionSummary || '',
            condition: updatedComponent.condition || comp.condition || 'fair',
            cleanliness: updatedComponent.cleanliness || comp.cleanliness || '',
            notes: updatedComponent.notes || comp.notes || '',
            images: comp.images || []
          };
          console.log(`🎯 DirectSave: Updated component ${componentId}:`, updated);
          return updated;
        }
        return comp;
      });

      if (!componentFound) {
        console.error(`❌ DirectSave: Component ${componentId} not found in room ${roomId}`);
        throw new Error(`Component ${componentId} not found`);
      }

      // Update the inspection with the new component data
      const newReportInfo = {
        ...currentReportInfo,
        components: updatedComponents
      };

      console.log(`🎯 DirectSave: Updating inspection ${inspection.id} with new report_info`);

      const { error: updateError } = await supabase
        .from('inspections')
        .update({ 
          report_info: newReportInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspection.id);

      if (updateError) {
        console.error(`❌ DirectSave: Failed to update inspection ${inspection.id}:`, updateError);
        throw updateError;
      }

      console.log(`✅ DirectSave: Successfully saved component ${componentId} to database`);
      
      toast({
        title: "Component Saved",
        description: "Component changes have been saved to the database.",
      });

      return true;

    } catch (error) {
      console.error(`❌ DirectSave: Failed to save component ${componentId}:`, error);
      
      toast({
        title: "Save Failed",
        description: "Failed to save component changes. Please try again.",
        variant: "destructive",
      });

      return false;
    }
  }, [toast]);

  return {
    saveComponentDirectly
  };
};