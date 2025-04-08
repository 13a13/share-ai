
import { jsPDF } from "jspdf";
import { Room, RoomComponent } from "@/types";
import { 
  pdfColors, 
  pdfFontSizes, 
  pdfFonts, 
  pdfMargins, 
  getConditionColor, 
  createElegantBox, 
  createSeparator, 
  formatDate 
} from "./pdfStyles";

export function generateRoomSection(
  doc: jsPDF, 
  room: Room,
  addHeaderAndFooter: () => void
): void {
  const pageWidth = doc.internal.pageSize.width;
  
  // Room Header - simplified
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.rect(pdfMargins.page, pdfMargins.page, pageWidth - (pdfMargins.page * 2), 20, "F");
  
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(room.name, pageWidth / 2, pdfMargins.page + 13, { align: "center" });
  
  // Room type badge - simplified
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.roundedRect(pageWidth / 2 - 25, pdfMargins.page + 25, 50, 10, 3, 3, "F");
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(room.type.replace('_', ' ').toUpperCase(), pageWidth / 2, pdfMargins.page + 31, { align: "center" });
  
  let yPosition = pdfMargins.page + 45;
  
  // General Condition Section
  if (room.generalCondition) {
    // Section box - simplified
    doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
    doc.rect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 30, "F");
    
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("General Condition", pdfMargins.page + 10, yPosition + 10);
    
    // Split long text into multiple lines
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "normal");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    
    const splitCondition = doc.splitTextToSize(room.generalCondition, pageWidth - (pdfMargins.page * 2) - 20);
    doc.text(splitCondition, pdfMargins.page + 10, yPosition + 20);
    
    yPosition += splitCondition.length * 6 + 15;
  }
  
  // Components Section
  if (room.components && room.components.length > 0) {
    // Section header - simplified
    doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    doc.rect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 16, "F");
    
    doc.setFontSize(pdfFontSizes.subtitle);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
    doc.text("Room Components", pageWidth / 2, yPosition + 11, { align: "center" });
    
    yPosition += 25;
    
    // Process each component
    for (const component of room.components) {
      yPosition = generateComponentSection(doc, component, yPosition, addHeaderAndFooter);
      
      // Add separator between components
      yPosition = createSeparator(doc, yPosition, pageWidth - (pdfMargins.page * 2));
      yPosition += 5;
    }
  } else {
    // Empty state - simplified
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "italic");
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    doc.text("No components have been added to this room.", pageWidth / 2, yPosition + 15, { align: "center" });
  }
}

function generateComponentSection(
  doc: jsPDF, 
  component: RoomComponent, 
  yPosition: number,
  addHeaderAndFooter: () => void
): number {
  const pageWidth = doc.internal.pageSize.width;
  const componentWidth = pageWidth - (pdfMargins.page * 2);
  
  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    addHeaderAndFooter();
    yPosition = pdfMargins.page;
  }
  
  // Component header - simplified
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.rect(pdfMargins.page, yPosition, componentWidth, 16, "F");
  
  // Component name
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(component.name, pdfMargins.page + 10, yPosition + 11);
  
  // Condition badge - simplified
  if (component.condition) {
    const conditionColorArray = getConditionColor(component.condition);
    const conditionText = component.condition.toUpperCase().replace('_', ' ');
    const badgeWidth = doc.getTextWidth(conditionText) + 10;
    
    doc.setFillColor(conditionColorArray[0], conditionColorArray[1], conditionColorArray[2]);
    doc.roundedRect(
      pageWidth - pdfMargins.page - badgeWidth - 5, 
      yPosition + 4, 
      badgeWidth, 
      8, 
      3, 
      3, 
      "F"
    );
    
    doc.setFontSize(pdfFontSizes.small);
    doc.setFont(pdfFonts.body, "bold");
    doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
    doc.text(
      conditionText, 
      pageWidth - pdfMargins.page - (badgeWidth / 2) - 5, 
      yPosition + 9, 
      { align: "center" }
    );
  }
  
  yPosition += 25;
  
  // Text details and image layout
  const hasImages = component.images && component.images.length > 0;
  const leftColWidth = hasImages ? (componentWidth / 2) - 5 : componentWidth;
  
  // Left column - text details
  let textYPosition = yPosition;
  
  // Component description
  if (component.description) {
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("Description", pdfMargins.page, textYPosition);
    
    textYPosition += 8;
    
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "normal");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    
    const splitDesc = doc.splitTextToSize(component.description, leftColWidth - 10);
    doc.text(splitDesc, pdfMargins.page, textYPosition);
    
    textYPosition += splitDesc.length * 6 + 10;
  }
  
  // Condition summary
  if (component.conditionSummary) {
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("Condition Summary", pdfMargins.page, textYPosition);
    
    textYPosition += 8;
    
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "normal");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    
    const splitSummary = doc.splitTextToSize(component.conditionSummary, leftColWidth - 10);
    doc.text(splitSummary, pdfMargins.page, textYPosition);
    
    textYPosition += splitSummary.length * 6 + 10;
  }
  
  // Notes
  if (component.notes) {
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("Notes", pdfMargins.page, textYPosition);
    
    textYPosition += 8;
    
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "italic");
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    
    const splitNotes = doc.splitTextToSize(component.notes, leftColWidth - 10);
    doc.text(splitNotes, pdfMargins.page, textYPosition);
    
    textYPosition += splitNotes.length * 6 + 10;
  }
  
  // Right column - images (if any)
  if (hasImages) {
    const rightColX = pdfMargins.page + leftColWidth + 10;
    let imageYPosition = yPosition;
    
    // Images header
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("Images", rightColX, imageYPosition);
    
    imageYPosition += 10;
    
    // Grid of images - simplified
    const imageSize = 35; // Slightly smaller
    const imagesPerRow = 2;
    const spacing = 5;
    
    for (let i = 0; i < component.images.length; i++) {
      const image = component.images[i];
      const row = Math.floor(i / imagesPerRow);
      const col = i % imagesPerRow;
      
      const xPos = rightColX + (col * (imageSize + spacing));
      const yPos = imageYPosition + (row * (imageSize + spacing + 15)); // Extra space for caption
      
      // Check if we need a new page for images
      if (yPos + imageSize + 15 > 270) {
        doc.addPage();
        addHeaderAndFooter();
        // Reset positions for new page
        imageYPosition = pdfMargins.page;
        textYPosition = Math.max(textYPosition, imageYPosition + ((Math.ceil(component.images.length / imagesPerRow) * (imageSize + spacing + 15))));
        
        // Add component continuation header
        doc.setFontSize(pdfFontSizes.header);
        doc.setFont(pdfFonts.heading, "bold");
        doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
        doc.text(`${component.name} (continued)`, pdfMargins.page, imageYPosition);
        
        imageYPosition += 15;
        
        // Recalculate positions for this image
        const newRow = Math.floor((i - (row * imagesPerRow)) / imagesPerRow);
        const xPos = rightColX + (col * (imageSize + spacing));
        const yPos = imageYPosition + (newRow * (imageSize + spacing + 15));
        
        try {
          // Image with simple border
          doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
          doc.rect(xPos, yPos, imageSize, imageSize, "F");
          doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
          doc.rect(xPos, yPos, imageSize, imageSize, "S");
          
          // Add image to PDF
          doc.addImage(
            image.url,  // URL or base64 string
            'JPEG',     // Format
            xPos + 1,   // X position
            yPos + 1,   // Y position
            imageSize - 2, // Width
            imageSize - 2  // Height
          );
          
          // Simple caption background
          doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
          doc.rect(xPos, yPos + imageSize, imageSize, 10, "F");
          
          // Add timestamp caption - fixed formatting
          const formattedDate = formatDate(image.timestamp);
          
          doc.setFontSize(pdfFontSizes.small);
          doc.setFont(pdfFonts.body, "normal");
          doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
          doc.text(formattedDate, xPos + (imageSize / 2), yPos + imageSize + 7, { align: "center" });
        } catch (error) {
          console.error("Error adding image to PDF:", error);
          
          // Error placeholder
          doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
          doc.rect(xPos, yPos, imageSize, imageSize, "S");
          
          doc.setFont(pdfFonts.body, "italic");
          doc.setFontSize(pdfFontSizes.small);
          doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
          doc.text("Image loading error", xPos + (imageSize / 2), yPos + (imageSize / 2), { align: "center" });
        }
      } else {
        try {
          // Image with simple border
          doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
          doc.rect(xPos, yPos, imageSize, imageSize, "F");
          doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
          doc.rect(xPos, yPos, imageSize, imageSize, "S");
          
          // Add image to PDF
          doc.addImage(
            image.url,  // URL or base64 string
            'JPEG',     // Format
            xPos + 1,   // X position
            yPos + 1,   // Y position
            imageSize - 2, // Width
            imageSize - 2  // Height
          );
          
          // Simple caption background
          doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
          doc.rect(xPos, yPos + imageSize, imageSize, 10, "F");
          
          // Add timestamp caption - fixed formatting
          const formattedDate = formatDate(image.timestamp);
          
          doc.setFontSize(pdfFontSizes.small);
          doc.setFont(pdfFonts.body, "normal");
          doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
          doc.text(formattedDate, xPos + (imageSize / 2), yPos + imageSize + 7, { align: "center" });
        } catch (error) {
          console.error("Error adding image to PDF:", error);
          
          // Error placeholder
          doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
          doc.rect(xPos, yPos, imageSize, imageSize, "S");
          
          doc.setFont(pdfFonts.body, "italic");
          doc.setFontSize(pdfFontSizes.small);
          doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
          doc.text("Image loading error", xPos + (imageSize / 2), yPos + (imageSize / 2), { align: "center" });
        }
      }
    }
    
    // Calculate the maximum y-position reached by images
    const rowsNeeded = Math.ceil(component.images.length / imagesPerRow);
    const imagesHeight = rowsNeeded * (imageSize + spacing + 15);
    const imagesEndY = imageYPosition + imagesHeight;
    
    // Use the maximum y-position between text and images
    yPosition = Math.max(textYPosition, imagesEndY);
  } else {
    // No images - just use text height
    yPosition = textYPosition;
  }
  
  return yPosition;
}
