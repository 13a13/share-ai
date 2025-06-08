
/**
 * Component Extraction Service for Checkout Reports
 * Handles extraction and processing of components from check-in reports
 */
export const CheckoutComponentExtractor = {
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
        // Enhanced room name extraction
        const roomName = room.name || room.type || room.roomType || 'Unknown Room';
        const roomId = this.createReadableRoomId(roomName, room.id);
        
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
      
      const mainRoomName = reportInfo.roomName || reportInfo.mainRoomName || 'Main Room';
      const mainRoomId = this.createReadableRoomId(mainRoomName);
      
      reportInfo.components.forEach((component: any, index: number) => {
        const processedComponent = this.processComponentData(
          component, 
          index, 
          mainRoomId, 
          mainRoomName
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
      const roomName = roomData.name || roomData.roomName || roomKey;
      const roomId = this.createReadableRoomId(roomName, roomKey);
      
      if (roomData.components && Array.isArray(roomData.components)) {
        console.log(`Found components in room key "${roomKey}":`, roomData.components.length);
        
        roomData.components.forEach((component: any, index: number) => {
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

    console.log(`Total components extracted: ${allComponents.length}`);
    return allComponents;
  },

  /**
   * Create a readable room ID from room name
   */
  createReadableRoomId(roomName: string, fallbackId?: string): string {
    if (!roomName || roomName === 'Unknown Room') {
      return fallbackId || 'general';
    }
    
    // Convert room name to a readable ID
    return roomName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();
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
      // Store enhanced check-in data for comparison
      checkinData: {
        originalCondition: component.condition,
        originalDescription: component.description,
        originalImages: componentImages,
        roomName: roomName, // Store room name in checkin data
        timestamp: component.timestamp || new Date().toISOString()
      }
    };

    console.log('Processed component:', componentData.name, 'in room:', roomName, 'with roomId:', roomId);
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
   * Create fallback component when no components are found
   */
  createFallbackComponent(): any {
    const roomName = 'General Assessment';
    const roomId = this.createReadableRoomId(roomName);
    
    return {
      id: 'general-assessment',
      name: 'General Property Condition',
      roomId: roomId,
      roomName: roomName,
      condition: 'unknown',
      conditionSummary: 'Overall property condition assessment',
      description: 'No specific components found in check-in report - assess general property condition',
      images: [],
      notes: 'General property assessment based on available check-in data',
      checkinData: {
        originalCondition: 'unknown',
        originalDescription: 'General assessment',
        originalImages: [],
        roomName: roomName,
        timestamp: new Date().toISOString()
      }
    };
  }
};
