import { jsPDF } from "jspdf";
import { Room, RoomComponent } from "@/types";
import { pdfStyles } from "../styles";
import { conditionRatingToText, normalizeConditionPoints } from "../../imageProcessingService";
import { addCompressedImage, checkPageOverflow } from "../utils/helpers";

/**
 * Generate room section with components
 */
export async function generateRoomSection(doc: jsPDF, room: Room, roomIndex: number): Promise<void> {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Room header with number
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text(`${roomIndex}. ${room.name.toUpperCase()}`, margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + doc.getTextWidth(`${roomIndex}. ${room.name.toUpperCase()}`) + 5, margins + 15);
  
  let yPosition = margins + 30;
  
  // General room condition
  if (room.generalCondition) {
    // Check if we need a page break before adding general condition
    if (checkPageOverflow(doc, yPosition, 20)) {
      doc.addPage();
      yPosition = margins;
      
      // Add room continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}. ${room.name} (continued)`, margins, yPosition);
      yPosition += 15;
    }
    
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.setFontSize(pdfStyles.fontSizes.normal);
    doc.text("General Condition:", margins, yPosition);
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    const splitCondition = doc.splitTextToSize(room.generalCondition, pageWidth - (margins * 2) - 20);
    
    // Check if the condition text would overflow
    if (checkPageOverflow(doc, yPosition, splitCondition.length * 6 + 10)) {
      doc.addPage();
      yPosition = margins;
      
      // Add room continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}. ${room.name} (continued)`, margins, yPosition);
      yPosition += 15;
      
      // Re-add the "General Condition:" header
      doc.setFont(pdfStyles.fonts.body, "bold");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text("General Condition:", margins, yPosition);
    }
    
    yPosition += 8;
    doc.setFont(pdfStyles.fonts.body, "normal");
    doc.text(splitCondition, margins, yPosition);
    yPosition += splitCondition.length * 6 + 10;
  }
  
  // Room Images
  if (room.images && room.images.length > 0) {
    const validImages = room.images.filter(img => img && img.url && img.url.trim() !== '');
    
    if (validImages.length > 0) {
      // Check if we need a page break before adding room overview
      if (checkPageOverflow(doc, yPosition, 10)) {
        doc.addPage();
        yPosition = margins;
        
        // Add room continuation header with minimal spacing
        doc.setFont(pdfStyles.fonts.header, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        doc.text(`${roomIndex}. ${room.name} (continued)`, margins, yPosition);
        yPosition += 5;
      }
      
      doc.setFont(pdfStyles.fonts.body, "bold");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text("Room Overview:", margins, yPosition);
      yPosition += 5;
      
      // Optimize image grid layout
      const imagesPerRow = 5;
      const spacing = 1;
      const imageWidth = (pageWidth - (margins * 2) - (spacing * (imagesPerRow - 1))) / imagesPerRow;
      const imageHeight = 30;
      
      let imageYPosition = yPosition;
      
      for (let i = 0; i < validImages.length; i++) {
        const col = i % imagesPerRow;
        const row = Math.floor(i / imagesPerRow);
        
        // Check if this row of images would overflow
        if (row > 0 && checkPageOverflow(doc, imageYPosition + (row * (imageHeight + 5)), imageHeight)) {
          doc.addPage();
          imageYPosition = margins + 5;
          i = (Math.floor(i / imagesPerRow) * imagesPerRow);
          
          // Add continuation header with minimal spacing
          doc.setFont(pdfStyles.fonts.header, "normal");
          doc.setFontSize(pdfStyles.fontSizes.normal);
          doc.text(`${roomIndex}. ${room.name} - Room Overview (continued)`, margins, imageYPosition - 3);
        }
        
        const xPos = margins + (col * (imageWidth + spacing));
        const yPos = imageYPosition + (row * (imageHeight + 5));
        
        try {
          await addCompressedImage(
            doc,
            validImages[i].url,
            `room_${room.id}_image_${i}`,
            xPos,
            yPos,
            imageWidth,
            imageHeight,
            validImages[i].timestamp,
            true
          );
        } catch (error) {
          console.error(`Error adding room image ${i}:`, error);
        }
      }
      
      const rowsUsed = Math.ceil(validImages.length / imagesPerRow);
      yPosition = imageYPosition + (rowsUsed * (imageHeight + 5)) + 3;
    }
  }
  
  // Components - ONLY include components that have analyzed images
  if (room.components && room.components.length > 0) {
    // Filter components to only include those with analyzed images
    const analyzedComponents = room.components.filter(component => {
      // Include components with images and any meaningful detail (description, AI summary, notes, condition, cleanliness, or condition points)
      const hasImages = component.images && component.images.length > 0;
      const hasDetail = !!(
        component.description ||
        component.conditionSummary ||
        component.notes ||
        component.condition ||
        component.cleanliness
      ) || (Array.isArray((component as any).conditionPoints) && (component as any).conditionPoints.length > 0);
      return hasImages && hasDetail;
    });
    
    // Sort components - standard ones first, then custom ones
    const sortedComponents = [...analyzedComponents].sort((a, b) => {
      if (a.isCustom && !b.isCustom) return 1;
      if (!a.isCustom && b.isCustom) return -1;
      return a.name.localeCompare(b.name);
    });
    
    // Generate component sections
    for (let i = 0; i < sortedComponents.length; i++) {
      const component = sortedComponents[i];
      
      // Check if we need a new page
      if (checkPageOverflow(doc, yPosition, 20)) {
        doc.addPage();
        yPosition = margins;
        
        // Add room continuation header
        doc.setFont(pdfStyles.fonts.header, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        doc.text(`${roomIndex}. ${room.name} (continued)`, margins, yPosition);
        yPosition += 15;
      }
      
      // Generate component content
      yPosition = await generateComponentSection(doc, component, roomIndex, i+1, yPosition);
    }
    
    // Show message if we filtered out all components
    if (analyzedComponents.length === 0 && room.components.length > 0) {
      doc.setFont(pdfStyles.fonts.body, "italic");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text("No analyzed components found in this room.", margins, yPosition);
      yPosition += 10;
    }
  } else {
    // No components found
    doc.setFont(pdfStyles.fonts.body, "italic");
    doc.setFontSize(pdfStyles.fontSizes.normal);
    doc.text("No components have been added to this room.", margins, yPosition);
    yPosition += 10;
  }

  return Promise.resolve();
}

/**
 * Generate a section for a specific room component
 */
async function generateComponentSection(
  doc: jsPDF, 
  component: RoomComponent, 
  roomIndex: number, 
  componentIndex: number,
  startY: number
): Promise<number> {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  let yPosition = startY;
  
  // Check if we need a new page for this component
  if (checkPageOverflow(doc, yPosition, 20)) {
    doc.addPage();
    yPosition = margins;
  }
  
  // Section header with component number
  const componentNumber = `${roomIndex}.${componentIndex}`;
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.sectionTitle);
  doc.text(`${componentNumber} ${component.name}`, margins, yPosition);
  yPosition += 10;
  
  // Component description
  if (component.description) {
    doc.setFont(pdfStyles.fonts.body, "normal");
    doc.setFontSize(pdfStyles.fontSizes.normal);
    
    const splitDescription = doc.splitTextToSize(component.description, pageWidth - (margins * 2) - 10);
    
    // Check if description would overflow into footer
    if (checkPageOverflow(doc, yPosition, splitDescription.length * 6 + 5)) {
      doc.addPage();
      yPosition = margins;
      
      // Add component continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
      yPosition += 10;
    }
    
    doc.text(splitDescription, margins, yPosition);
    yPosition += splitDescription.length * 6 + 5;
  }
  
  // Component condition
  if (component.condition) {
    // Check if adding condition would overflow into footer
    if (checkPageOverflow(doc, yPosition, 10)) {
      doc.addPage();
      yPosition = margins;
      
      // Add component continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
      yPosition += 10;
    }
    
    // Robust condition formatting: support string, object { rating }, or number
    let formattedCondition = "Not specified";
    try {
      if (typeof component.condition === 'object' && component.condition !== null) {
        const rating = (component.condition as { rating?: string }).rating || '';
        formattedCondition = rating ? conditionRatingToText(rating) : "Not specified";
      } else if (typeof component.condition === 'string') {
        formattedCondition = conditionRatingToText(component.condition || '');
      } else if (typeof component.condition === 'number') {
        const ratings = ["Poor", "Fair", "Average", "Good", "Excellent"];
        const index = Math.min(Math.max(Math.floor(component.condition) - 1, 0), 4);
        formattedCondition = ratings[index];
      }
    } catch (error) {
      console.error(`Error formatting condition for component ${component.name}:`, error);
      // Fallbacks already set above
    }
    
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.text("Condition:", margins, yPosition);
    doc.setFont(pdfStyles.fonts.body, "normal");
    doc.text(formattedCondition, margins + 25, yPosition);
    yPosition += 7;
  }
  
  // AI Analysis Summary - Enhanced with better text handling
  if (component.conditionSummary && component.conditionSummary.trim() !== '') {
    // Check if AI analysis header would overflow into footer
    if (checkPageOverflow(doc, yPosition, 10)) {
      doc.addPage();
      yPosition = margins;
      
      // Add component continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
      yPosition += 10;
    }
    
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.text("AI Analysis:", margins, yPosition);
    yPosition += 6;
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    
    // Enhanced text processing: ensure full content is preserved
    const fullText = component.conditionSummary.toString().trim();
    const maxWidth = pageWidth - (margins * 2) - 10;
    const splitSummary = doc.splitTextToSize(fullText, maxWidth);
    
    // Process text in chunks to prevent truncation
    const chunkSize = 20; // Lines per chunk
    for (let i = 0; i < splitSummary.length; i += chunkSize) {
      const chunk = splitSummary.slice(i, i + chunkSize);
      
      // Check if this chunk would overflow into footer
      if (checkPageOverflow(doc, yPosition, chunk.length * 6 + 3)) {
        doc.addPage();
        yPosition = margins;
        
        // Add component continuation header
        doc.setFont(pdfStyles.fonts.header, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        doc.text(`${roomIndex}.${componentIndex} ${component.name} - AI Analysis (continued)`, margins, yPosition);
        yPosition += 10;
        
        // Reset font for content
        doc.setFont(pdfStyles.fonts.body, "normal");
      }
      
      doc.text(chunk, margins + 5, yPosition);
      yPosition += chunk.length * 6 + 3;
    }
    
    yPosition += 2; // Extra spacing after AI analysis
  }

  // Condition Points / AI Findings
  const rawPoints = (component as any).conditionPoints as any[] | undefined;
  const conditionPoints = Array.isArray(rawPoints) ? normalizeConditionPoints(rawPoints) : [];

  if (conditionPoints.length > 0) {
    // Check if header would overflow into footer
    if (checkPageOverflow(doc, yPosition, 10)) {
      doc.addPage();
      yPosition = margins;
      // Add component continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
      yPosition += 10;
    }

    doc.setFont(pdfStyles.fonts.body, "bold");
    const findingsHeader = (component.conditionSummary && component.conditionSummary.trim() !== '') ? "AI Findings:" : "Additional Findings:";
    doc.text(findingsHeader, margins, yPosition);
    yPosition += 6;

    doc.setFont(pdfStyles.fonts.body, "normal");
    const maxWidth = pageWidth - (margins * 2) - 20;

    for (let i = 0; i < conditionPoints.length; i++) {
      const pointText = String(conditionPoints[i]);
      const lines = doc.splitTextToSize(pointText, maxWidth);

      // Check overflow for this bullet
      if (checkPageOverflow(doc, yPosition, lines.length * 6 + 2)) {
        doc.addPage();
        yPosition = margins;
        // Continuation header
        doc.setFont(pdfStyles.fonts.header, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        doc.text(`${roomIndex}.${componentIndex} ${component.name} - ${findingsHeader.replace(':','')} (continued)`, margins, yPosition);
        yPosition += 10;
        doc.setFont(pdfStyles.fonts.body, "normal");
      }

      // First line with bullet
      doc.text(`• ${lines[0]}`, margins + 5, yPosition);
      // Subsequent lines indented
      for (let li = 1; li < lines.length; li++) {
        yPosition += 6;
        doc.text(lines[li], margins + 12, yPosition);
      }
      yPosition += 6; // space between bullets
    }

    yPosition += 2;
  }
  
  // Inspector Notes - only show if there are manual notes
  if (component.notes && component.notes.trim() !== '') {
    // Check if notes header would overflow into footer
    if (checkPageOverflow(doc, yPosition, 10)) {
      doc.addPage();
      yPosition = margins;
      
      // Add component continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
      yPosition += 10;
    }
    
    yPosition += 2;
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.text("Inspector Notes:", margins, yPosition);
    yPosition += 6;
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    const splitNotes = doc.splitTextToSize(component.notes, pageWidth - (margins * 2) - 10);
    
    // Check if notes content would overflow into footer
    if (checkPageOverflow(doc, yPosition, splitNotes.length * 6 + 5)) {
      doc.addPage();
      yPosition = margins;
      
      // Add component continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}.${componentIndex} ${component.name} - Inspector Notes (continued)`, margins, yPosition);
      yPosition += 10;
    }
    
    doc.text(splitNotes, margins + 5, yPosition);
    yPosition += splitNotes.length * 6 + 5;
  }
  
  // Component images - show all images in a standardized format
  if (component.images && component.images.length > 0) {
    // Filter out any invalid images
    const validImages = component.images.filter(img => img && img.url && img.url.trim() !== '');
    
    if (validImages.length > 0) {
      // Check if adding images would overflow into footer
      if (checkPageOverflow(doc, yPosition, 15)) {  // Header space
        doc.addPage();
        yPosition = margins;
        
        // Add component continuation header
        doc.setFont(pdfStyles.fonts.header, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        doc.text(`${roomIndex}.${componentIndex} ${component.name} - Images`, margins, yPosition);
        yPosition += 10;
      }
      
      // Standard image sizes - updated to display in a grid with 5 images per row
      const imagesPerRow = 5;
      const spacing = 2;
      const imageWidth = (pageWidth - (margins * 2) - ((imagesPerRow - 1) * spacing)) / imagesPerRow;
      const imageHeight = 30;
      
      let currentY = yPosition;
      
      for (let j = 0; j < validImages.length; j++) {
        const col = j % imagesPerRow;
        const row = Math.floor(j / imagesPerRow);
        
        // Check if starting a new row would overflow into footer
        if (col === 0 && row > 0 && checkPageOverflow(doc, currentY + (imageHeight + 10), imageHeight)) {
          doc.addPage();
          currentY = margins;
          
          // Add component continuation header
          doc.setFont(pdfStyles.fonts.header, "normal");
          doc.setFontSize(pdfStyles.fontSizes.normal);
          doc.text(`${roomIndex}.${componentIndex} ${component.name} - Images (continued)`, margins, currentY);
          currentY += 10;
        }
        
        const xPos = margins + (col * (imageWidth + spacing));
        const yPos = currentY + (row * (imageHeight + 8));
        
        try {
          await addCompressedImage(
            doc,
            validImages[j].url,
            `component_${component.id}_image_${j}`,
            xPos,
            yPos,
            imageWidth,
            imageHeight,
            validImages[j].timestamp,
            true
          );
        } catch (error) {
          console.error(`Error adding component image ${j}:`, error);
        }
      }
      
      const rowsUsed = Math.ceil(validImages.length / imagesPerRow);
      yPosition = currentY + (rowsUsed * (imageHeight + 8)) + 5;
    }
  }
  
  return yPosition;
}
