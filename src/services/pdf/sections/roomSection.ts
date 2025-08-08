import { jsPDF } from "jspdf";
import { Room, RoomComponent } from "@/types";
import { pdfStyles } from "../styles";
import { conditionRatingToText, normalizeConditionPoints, cleanlinessOptions } from "../../imageProcessingService";
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
    // Intentionally do nothing when no components exist.
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
  if (component.description && component.description.trim() !== '') {
    doc.setFont(pdfStyles.fonts.body, "normal");
    doc.setFontSize(pdfStyles.fontSizes.normal);
    
    const splitDescription = doc.splitTextToSize(component.description, pageWidth - (margins * 2) - 10);
    
    // Check if description header/content would overflow into footer
    if (checkPageOverflow(doc, yPosition, splitDescription.length * 6 + 12)) {
      doc.addPage();
      yPosition = margins;
      
      // Add component continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
      yPosition += 10;
    }
    
    // Header
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.text("Description:", margins, yPosition);
    yPosition += 6;
    
    // Content
    doc.setFont(pdfStyles.fonts.body, "normal");
    doc.text(splitDescription, margins, yPosition);
    yPosition += splitDescription.length * 6 + 5;
  }
  
  // Component details sections (Condition analysis, Findings, and images)
  {
    // Section: Condition (AI Analysis)
    if (component.conditionSummary && String(component.conditionSummary).trim() !== '') {
      if (checkPageOverflow(doc, yPosition, 10)) {
        doc.addPage();
        yPosition = margins;
        // Continuation header
        doc.setFont(pdfStyles.fonts.header, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
        yPosition += 10;
      }
      doc.setFont(pdfStyles.fonts.body, "bold");
      doc.text("Condition:", margins, yPosition);
      yPosition += 6;

      doc.setFont(pdfStyles.fonts.body, "normal");
      const fullText = component.conditionSummary.toString().trim();
      const maxWidth = pageWidth - (margins * 2) - 10;
      const splitSummary = doc.splitTextToSize(fullText, maxWidth);

      const chunkSize = 20;
      for (let i = 0; i < splitSummary.length; i += chunkSize) {
        const chunk = splitSummary.slice(i, i + chunkSize);
        if (checkPageOverflow(doc, yPosition, chunk.length * 6 + 3)) {
          doc.addPage();
          yPosition = margins;
          // Continuation header
          doc.setFont(pdfStyles.fonts.header, "normal");
          doc.setFontSize(pdfStyles.fontSizes.normal);
          doc.text(`${roomIndex}.${componentIndex} ${component.name} - Condition (continued)`, margins, yPosition);
          yPosition += 10;
          doc.setFont(pdfStyles.fonts.body, "normal");
        }
        doc.text(chunk, margins + 5, yPosition);
        yPosition += chunk.length * 6 + 3;
      }
      yPosition += 2;
    }

    // Section: Findings (AI Findings)
    const rawPoints = (component as any).conditionPoints as any[] | undefined;
    const conditionPoints = Array.isArray(rawPoints) ? normalizeConditionPoints(rawPoints) : [];

    // Always show Findings section header (even if no points)
    if (checkPageOverflow(doc, yPosition, 10)) {
      doc.addPage();
      yPosition = margins;
      // Continuation header
      doc.setFont(pdfStyles.fonts.header, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
      yPosition += 10;
    }

    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.text("Findings:", margins, yPosition);
    yPosition += 6;

    doc.setFont(pdfStyles.fonts.body, "normal");
    const maxWidth = pageWidth - (margins * 2) - 20;

    if (conditionPoints.length > 0) {
      for (let i = 0; i < conditionPoints.length; i++) {
        const pointText = String(conditionPoints[i]);
        const lines = doc.splitTextToSize(pointText, maxWidth);
        if (checkPageOverflow(doc, yPosition, lines.length * 6 + 2)) {
          doc.addPage();
          yPosition = margins;
          // Continuation header
          doc.setFont(pdfStyles.fonts.header, "normal");
          doc.setFontSize(pdfStyles.fontSizes.normal);
          doc.text(`${roomIndex}.${componentIndex} ${component.name} - Findings (continued)`, margins, yPosition);
          yPosition += 10;
          doc.setFont(pdfStyles.fonts.body, "normal");
        }
        doc.text(`• ${lines[0]}`, margins + 5, yPosition);
        for (let li = 1; li < lines.length; li++) {
          yPosition += 6;
          doc.text(lines[li], margins + 12, yPosition);
        }
        yPosition += 6;
      }
    }
    yPosition += 2;

    // Inspector Notes - only show if there are manual notes (moved above images)
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
      doc.text("Notes:", margins, yPosition);
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
        doc.text(`${roomIndex}.${componentIndex} ${component.name} - Notes (continued)`, margins, yPosition);
        yPosition += 10;
      }
      
      doc.text(splitNotes, margins + 5, yPosition);
      yPosition += splitNotes.length * 6 + 5;
    }

    // Analysed images grid (no additional title)
    const allImages = Array.isArray(component.images) ? component.images : [];
    const analysedImages = allImages.filter((img: any) => img && img.url && img.url.trim() !== '' && (img.aiProcessed || !!img.aiData));
    if (analysedImages.length > 0) {
      if (checkPageOverflow(doc, yPosition, 8)) {
        doc.addPage();
        yPosition = margins;
        // Continuation header
        doc.setFont(pdfStyles.fonts.header, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, yPosition);
        yPosition += 8;
      }

      const imagesPerRow = 4;
      const spacing = 2;
      const imageWidth = (pageWidth - (margins * 2) - (spacing * (imagesPerRow - 1))) / imagesPerRow;
      const imageHeight = 35;

      let imageYPosition = yPosition;

      for (let i = 0; i < analysedImages.length; i++) {
        const col = i % imagesPerRow;
        const row = Math.floor(i / imagesPerRow);

        if (row > 0 && checkPageOverflow(doc, imageYPosition + (row * (imageHeight + 5)), imageHeight)) {
          doc.addPage();
          imageYPosition = margins + 5;
          // Continuation header
          doc.setFont(pdfStyles.fonts.header, "normal");
          doc.setFontSize(pdfStyles.fontSizes.normal);
          doc.text(`${roomIndex}.${componentIndex} ${component.name} (continued)`, margins, imageYPosition - 3);
        }

        const xPos = margins + (col * (imageWidth + spacing));
        const yPos = imageYPosition + (row * (imageHeight + 5));

        try {
          await addCompressedImage(
            doc,
            analysedImages[i].url,
            `component_${component.id}_image_${i}`,
            xPos,
            yPos,
            imageWidth,
            imageHeight,
            analysedImages[i].timestamp,
            true
          );
        } catch (error) {
          console.error(`Error adding component image ${i}:`, error);
        }
      }

      const rowsUsed = Math.ceil(analysedImages.length / imagesPerRow);
      yPosition = imageYPosition + (rowsUsed * (imageHeight + 5)) + 3;
    }
  }
  

  
  
  
  return yPosition;
}
