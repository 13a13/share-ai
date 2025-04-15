
import { jsPDF } from "jspdf";
import { Room, RoomComponent } from "@/types";
import { pdfStyles } from "../styles";
import { conditionRatingToText } from "../../imageProcessingService";
import { addCompressedImage } from "../utils/helpers";

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
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.setFontSize(pdfStyles.fontSizes.normal);
    doc.text("General Condition:", margins, yPosition);
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    const splitCondition = doc.splitTextToSize(room.generalCondition, pageWidth - (margins * 2) - 20);
    yPosition += 8;
    doc.text(splitCondition, margins, yPosition);
    yPosition += splitCondition.length * 6 + 10;
  }
  
  // Room Images
  if (room.images && room.images.length > 0) {
    // Only show up to 4 images per room
    const maxImages = Math.min(room.images.length, 4);
    const imagesPerRow = 2;
    const imageWidth = (pageWidth - (margins * 2) - 10) / imagesPerRow;
    const imageHeight = 40;
    
    let imageYPosition = yPosition;
    
    for (let i = 0; i < maxImages; i++) {
      const col = i % imagesPerRow;
      const row = Math.floor(i / imagesPerRow);
      const xPos = margins + (col * (imageWidth + 5));
      const yPos = imageYPosition + (row * (imageHeight + 15));
      
      try {
        await addCompressedImage(
          doc,
          room.images[i].url,
          `room_${room.id}_image_${i}`,
          xPos,
          yPos,
          imageWidth,
          imageHeight,
          room.images[i].timestamp
        );
      } catch (error) {
        console.error(`Error adding room image ${i}:`, error);
        
        // Draw placeholder if image can't be loaded
        doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
        doc.setFillColor(pdfStyles.colors.white[0], pdfStyles.colors.white[1], pdfStyles.colors.white[2]);
        doc.rect(xPos, yPos, imageWidth, imageHeight, 'FD');
        
        doc.setFont(pdfStyles.fonts.body, "italic");
        doc.setFontSize(pdfStyles.fontSizes.small);
        doc.text("Image not available", xPos + imageWidth / 2, yPos + imageHeight / 2, { align: "center" });
      }
    }
    
    // Update y position after images
    yPosition = imageYPosition + (Math.ceil(maxImages / imagesPerRow) * (imageHeight + 15)) + 10;
  }
  
  // Components
  if (room.components && room.components.length > 0) {
    // Sort components - standard ones first, then custom ones
    const sortedComponents = [...room.components].sort((a, b) => {
      if (a.isCustom && !b.isCustom) return 1;
      if (!a.isCustom && b.isCustom) return -1;
      return a.name.localeCompare(b.name);
    });
    
    // Generate component sections
    for (let i = 0; i < sortedComponents.length; i++) {
      const component = sortedComponents[i];
      
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.height - 40) {
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
    doc.text(splitDescription, margins, yPosition);
    yPosition += splitDescription.length * 6 + 5;
  }
  
  // Component condition
  if (component.condition) {
    const formattedCondition = conditionRatingToText(component.condition);
    
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.text("Condition:", margins, yPosition);
    doc.setFont(pdfStyles.fonts.body, "normal");
    doc.text(formattedCondition, margins + 25, yPosition);
    yPosition += 7;
  }
  
  // Additional condition details
  if (component.conditionSummary) {
    const splitSummary = doc.splitTextToSize(component.conditionSummary, pageWidth - (margins * 2) - 10);
    doc.text(splitSummary, margins, yPosition);
    yPosition += splitSummary.length * 6 + 3;
  }
  
  // Condition points as bullet points
  if (component.conditionPoints && component.conditionPoints.length > 0) {
    yPosition += 2;
    for (const point of component.conditionPoints) {
      if (point.trim()) {
        doc.text("• " + point, margins + 5, yPosition);
        yPosition += 6;
      }
    }
    yPosition += 3;
  }
  
  // Component notes
  if (component.notes) {
    yPosition += 2;
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.text("Notes:", margins, yPosition);
    yPosition += 6;
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    const splitNotes = doc.splitTextToSize(component.notes, pageWidth - (margins * 2) - 10);
    doc.text(splitNotes, margins + 5, yPosition);
    yPosition += splitNotes.length * 6 + 5;
  }
  
  // Component images
  if (component.images && component.images.length > 0) {
    // Only show up to 3 images per component
    const maxImages = Math.min(component.images.length, 3);
    const imageWidth = (pageWidth - (margins * 2) - 10) / maxImages;
    const imageHeight = 30;
    
    let imageYPosition = yPosition;
    
    for (let j = 0; j < maxImages; j++) {
      const xPos = margins + (j * (imageWidth + 5));
      
      try {
        await addCompressedImage(
          doc,
          component.images[j].url,
          `component_${component.id}_image_${j}`,
          xPos,
          imageYPosition,
          imageWidth,
          imageHeight,
          component.images[j].timestamp
        );
      } catch (error) {
        console.error(`Error adding component image ${j}:`, error);
        
        // Draw placeholder if image can't be loaded
        doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
        doc.setFillColor(pdfStyles.colors.white[0], pdfStyles.colors.white[1], pdfStyles.colors.white[2]);
        doc.rect(xPos, imageYPosition, imageWidth, imageHeight, 'FD');
        
        doc.setFont(pdfStyles.fonts.body, "italic");
        doc.setFontSize(pdfStyles.fontSizes.small);
        doc.text("Image not available", xPos + imageWidth / 2, imageYPosition + imageHeight / 2, { align: "center" });
      }
    }
    
    // Update y position after images
    yPosition = imageYPosition + imageHeight + 15;
  }
  
  return yPosition;
}
