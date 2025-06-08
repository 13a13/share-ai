
import { supabase } from '@/integrations/supabase/client';
import { CheckoutData } from './checkoutTypes';
import { CheckoutComparisonAPI } from './checkoutComparisonApi';

/**
 * Checkout Report API - Enhanced Implementation
 */
export const CheckoutReportAPI = {
  /**
   * Phase 2: Create a basic checkout report
   */
  async createBasicCheckoutReport(checkinReportId: string, checkoutData: CheckoutData): Promise<any> {
    try {
      console.log('Creating basic checkout report for:', checkinReportId);
      
      // First, fetch the check-in report to get the room_id
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report:', fetchError);
        throw fetchError;
      }

      if (!checkinReport.room_id) {
        throw new Error('Check-in report does not have a valid room_id');
      }

      // Create the checkout inspection record with the same room_id as check-in
      const { data: checkoutInspection, error: createError } = await supabase
        .from('inspections')
        .insert({
          room_id: checkinReport.room_id,
          is_checkout: true,
          checkout_report_id: checkinReportId,
          checkout_date: checkoutData.date || new Date().toISOString(),
          checkout_clerk: checkoutData.clerk || '',
          checkout_tenant_name: checkoutData.tenantName || '',
          checkout_tenant_present: checkoutData.tenantPresent || false,
          status: 'in_progress'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating checkout report:', createError);
        throw createError;
      }

      console.log('Basic checkout report created successfully:', checkoutInspection);
      return checkoutInspection;
    } catch (error) {
      console.error('Error in createBasicCheckoutReport:', error);
      throw error;
    }
  },

  /**
   * Enhanced component extraction from check-in report
   */
  extractComponentsFromCheckinReport(reportInfo: any): any[] {
    console.log('Extracting components from report info:', reportInfo);
    
    if (!reportInfo) {
      console.log('No report info provided');
      return [];
    }

    const allComponents: any[] = [];

    // Strategy 1: Check for additionalRooms in report_info
    if (reportInfo.additionalRooms && Array.isArray(reportInfo.additionalRooms)) {
      console.log('Found additionalRooms with', reportInfo.additionalRooms.length, 'rooms');
      
      reportInfo.additionalRooms.forEach((room: any) => {
        const roomId = room.id || room.name || 'unknown-room';
        const roomName = room.name || room.type || 'Unknown Room';
        
        if (room.components && Array.isArray(room.components)) {
          room.components.forEach((component: any, index: number) => {
            const processedComponent = this.processComponentData(
              component, 
              index, 
              roomId, 
              roomName
            );
            if (processedComponent) {
              allComponents.push(processedComponent);
            }
          });
        }
      });
    }

    // Strategy 2: Check for main room components
    if (reportInfo.components && Array.isArray(reportInfo.components)) {
      console.log('Found main room components:', reportInfo.components.length);
      
      reportInfo.components.forEach((component: any, index: number) => {
        const processedComponent = this.processComponentData(
          component, 
          index, 
          'main-room', 
          reportInfo.roomName || 'Main Room'
        );
        if (processedComponent) {
          allComponents.push(processedComponent);
        }
      });
    }

    // Strategy 3: Check for flat structure with rooms as keys
    const possibleRoomKeys = Object.keys(reportInfo).filter(key => 
      key !== 'additionalRooms' && 
      key !== 'components' && 
      key !== 'roomName' &&
      key !== 'generalCondition' &&
      typeof reportInfo[key] === 'object' && 
      reportInfo[key] !== null &&
      reportInfo[key].components
    );

    possibleRoomKeys.forEach(roomKey => {
      const roomData = reportInfo[roomKey];
      
      if (roomData.components && Array.isArray(roomData.components)) {
        console.log(`Found components in room key "${roomKey}":`, roomData.components.length);
        
        roomData.components.forEach((component: any, index: number) => {
          const processedComponent = this.processComponentData(
            component, 
            index, 
            roomKey, 
            roomData.name || roomKey
          );
          if (processedComponent) {
            allComponents.push(processedComponent);
          }
        });
      }
    });

    console.log(`Total components extracted: ${allComponents.length}`);
    return allComponents;
  },

  /**
   * Process individual component data with enhanced extraction
   */
  processComponentData(component: any, index: number, roomId: string, roomName: string): any | null {
    if (!component) return null;

    // Extract component images with better handling
    const componentImages = this.extractComponentImages(component);
    
    // Extract component details
    const componentData = {
      id: component.id || component.componentId || `${roomId}-component-${index}`,
      name: component.name || component.componentName || component.title || `Component ${index + 1}`,
      roomId: roomId,
      roomName: roomName,
      condition: component.condition || component.conditionRating || 'unknown',
      conditionSummary: component.conditionSummary || component.summary || '',
      description: component.description || component.analysis || component.notes || '',
      images: componentImages,
      notes: component.notes || component.additionalNotes || '',
      cleanliness: component.cleanliness || 'unknown',
      conditionPoints: component.conditionPoints || [],
      // Store original check-in data for comparison
      checkinData: {
        originalCondition: component.condition,
        originalDescription: component.description,
        originalImages: componentImages,
        timestamp: component.timestamp || new Date().toISOString()
      }
    };

    console.log('Processed component:', componentData.name, 'in room:', roomName);
    return componentData;
  },

  /**
   * Enhanced image extraction from component data
   */
  extractComponentImages(component: any): string[] {
    const images: string[] = [];
    
    // Check various possible image properties
    const imageSources = [
      component.images,
      component.componentImages,
      component.photos,
      component.imageUrls
    ];

    imageSources.forEach(source => {
      if (Array.isArray(source)) {
        source.forEach(img => {
          if (typeof img === 'string') {
            images.push(img);
          } else if (img && img.url) {
            images.push(img.url);
          } else if (img && img.src) {
            images.push(img.src);
          }
        });
      }
    });

    // Also check for single image properties
    if (component.image && typeof component.image === 'string') {
      images.push(component.image);
    }
    if (component.imageUrl && typeof component.imageUrl === 'string') {
      images.push(component.imageUrl);
    }

    return [...new Set(images)]; // Remove duplicates
  },

  /**
   * Phase 3: Initialize component comparisons for existing checkout
   */
  async initializeComponentComparisons(checkoutReportId: string, checkinReportId: string): Promise<any[]> {
    try {
      console.log('Initializing component comparisons for checkout:', checkoutReportId);
      
      // Fetch the check-in report to get all components and room_id
      const { data: checkinReport, error: fetchError } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', checkinReportId)
        .single();

      if (fetchError) {
        console.error('Error fetching check-in report for components:', fetchError);
        throw fetchError;
      }

      console.log('Raw check-in report data:', checkinReport);

      // Use enhanced component extraction
      const allComponents = this.extractComponentsFromCheckinReport(checkinReport.report_info);

      console.log('Enhanced extraction found components:', allComponents.length);

      // If no components found, create a general assessment component
      if (allComponents.length === 0) {
        console.warn('No components found in check-in report, creating general assessment');
        
        const fallbackComponent = {
          id: 'general-assessment',
          name: 'General Property Condition',
          roomId: 'general',
          roomName: 'General Assessment',
          condition: 'unknown',
          conditionSummary: 'Overall property condition assessment',
          description: 'No specific components found in check-in report - assess general property condition',
          images: [],
          notes: 'General property assessment based on available check-in data',
          checkinData: {
            originalCondition: 'unknown',
            originalDescription: 'General assessment',
            originalImages: [],
            timestamp: new Date().toISOString()
          }
        };
        
        allComponents.push(fallbackComponent);
      }

      // Initialize comparison records for all components
      await CheckoutComparisonAPI.initializeCheckoutComparisons(
        checkoutReportId,
        checkinReportId,
        allComponents
      );

      return allComponents;
    } catch (error) {
      console.error('Error in initializeComponentComparisons:', error);
      throw error;
    }
  },

  /**
   * Complete a checkout report
   */
  async completeCheckoutReport(checkoutReportId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', checkoutReportId);

      if (error) {
        console.error('Error completing checkout report:', error);
        throw error;
      }

      console.log('Checkout report completed:', checkoutReportId);
    } catch (error) {
      console.error('Error in completeCheckoutReport:', error);
      throw error;
    }
  }
};
