
import { jsPDF } from "jspdf";
import { Room, RoomComponent } from "@/types";
import { pdfColors, pdfFontSizes, getConditionColor } from "./pdfStyles";

export function generateRoomSection(
  doc: jsPDF, 
  room: Room,
  addHeaderAndFooter: () => void
): void {
  // Room Header
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.text(room.name, 105, 20, { align: "center" });
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text(`Room Type: ${room.type.replace('_', ' ')}`, 105, 30, { align: "center" });
  
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  // General Condition
  if (room.generalCondition) {
    doc.setFontSize(pdfFontSizes.subtitle);
    doc.setFont("helvetica", "bold");
    doc.text("General Condition", 20, 45);
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont("helvetica", "normal");
    
    // Split long text into multiple lines
    const splitCondition = doc.splitTextToSize(room.generalCondition, 170);
    doc.text(splitCondition, 20, 55);
  }
  
  // Components Section
  let yPosition = room.generalCondition ? 55 + (doc.splitTextToSize(room.generalCondition, 170).length * 7) : 45;
  
  if (room.components && room.components.length > 0) {
    doc.setFontSize(pdfFontSizes.subtitle);
    doc.setFont("helvetica", "bold");
    doc.text("Components", 20, yPosition + 10);
    
    yPosition += 20;
    
    // Process each component
    for (const component of room.components) {
      yPosition = generateComponentSection(doc, component, yPosition, addHeaderAndFooter);
    }
  } else {
    doc.text("No components have been added to this room.", 20, yPosition + 10);
  }
}

function generateComponentSection(
  doc: jsPDF, 
  component: RoomComponent, 
  yPosition: number,
  addHeaderAndFooter: () => void
): number {
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    addHeaderAndFooter();
    yPosition = 20;
  }
  
  // Component box with enhanced background
  const boxHeight = calculateComponentBoxHeight(doc, component);
  const colorR = pdfColors.bgGray[0];
  const colorG = pdfColors.bgGray[1];
  const colorB = pdfColors.bgGray[2];
  
  doc.setFillColor(colorR, colorG, colorB);
  doc.roundedRect(15, yPosition, 180, boxHeight, 3, 3, "F");
  
  // Component title and condition badge in header box
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(15, yPosition, 180, 14, 3, 3, "F");
  
  // Component name
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(component.name, 20, yPosition + 10);
  
  // Condition badge
  if (component.condition) {
    const conditionColorArray = getConditionColor(component.condition);
    
    doc.setFillColor(conditionColorArray[0], conditionColorArray[1], conditionColorArray[2]);
    doc.roundedRect(150, yPosition + 4, 40, 7, 2, 2, "F");
    doc.setFontSize(pdfFontSizes.small);
    doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
    doc.text(component.condition.toUpperCase(), 170, yPosition + 9, { align: "center" });
  }
  
  let contentYPosition = yPosition + 20;
  
  // Component description
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  if (component.description) {
    const splitDesc = doc.splitTextToSize(component.description, 170);
    doc.text(splitDesc, 20, contentYPosition);
    contentYPosition += splitDesc.length * 7;
  }
  
  // Condition summary if available
  if (component.conditionSummary) {
    doc.setFont("helvetica", "bold");
    doc.text("Condition Summary:", 20, contentYPosition + 5);
    doc.setFont("helvetica", "normal");
    
    const splitSummary = doc.splitTextToSize(component.conditionSummary, 170);
    doc.text(splitSummary, 20, contentYPosition + 12);
    contentYPosition += (splitSummary.length * 7) + 12;
  } else {
    contentYPosition += 5;
  }
  
  // Component notes
  if (component.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 20, contentYPosition + 5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    
    const splitNotes = doc.splitTextToSize(component.notes, 170);
    doc.text(splitNotes, 20, contentYPosition + 12);
    contentYPosition += (splitNotes.length * 7) + 12;
  } else {
    contentYPosition += 5;
  }
  
  // Add component images if they exist
  if (component.images && component.images.length > 0) {
    // Check if we need a new page for images
    if (contentYPosition > 200) {
      doc.addPage();
      addHeaderAndFooter();
      contentYPosition = 20;
      
      // Add component name as a header on the new page
      doc.setFontSize(pdfFontSizes.header);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.text(`${component.name} (Images)`, 20, contentYPosition);
      contentYPosition += 15;
    } else {
      // Add images section header
      doc.setFontSize(pdfFontSizes.small);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
      doc.text("Images:", 20, contentYPosition + 5);
      contentYPosition += 10;
    }
    
    // Calculate how many images to show per row (2 images per row)
    const imagesPerRow = 2;
    const rows = Math.ceil(component.images.length / imagesPerRow);
    
    for (let row = 0; row < rows; row++) {
      // Check if we need a new page
      if (contentYPosition > 220) {
        doc.addPage();
        addHeaderAndFooter();
        contentYPosition = 20;
        
        // Add component name as a header on the new page
        doc.setFontSize(pdfFontSizes.header);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
        doc.text(`${component.name} (Images)`, 20, contentYPosition);
        contentYPosition += 15;
      }
      
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index < component.images.length) {
          const image = component.images[index];
          const xPos = 20 + col * 90;
          
          try {
            // Add timestamp below image
            const date = new Date(image.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            // Add image to PDF
            doc.addImage(
              image.url,       // URL or base64 string
              'JPEG',          // Format (JPEG, PNG, etc.)
              xPos,            // X position
              contentYPosition, // Y position
              80,              // Width
              60               // Height
            );
            
            // Add timestamp under the image
            doc.setFontSize(pdfFontSizes.small);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
            doc.text(formattedDate, xPos + 40, contentYPosition + 65, { align: "center" });
          } catch (error) {
            console.error("Error adding image to PDF:", error);
            
            // Add error placeholder
            const r = 220, g = 220, b = 220;
            doc.setFillColor(r, g, b);
            doc.rect(xPos, contentYPosition, 80, 60, "F");
            doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
            doc.text("Image loading error", xPos + 40, contentYPosition + 30, { align: "center" });
          }
        }
      }
      contentYPosition += 70; // Move down for the next row of images
    }
  }
  
  return contentYPosition + 15; // Add spacing between components
}

// Helper function to calculate component box height
function calculateComponentBoxHeight(doc: jsPDF, component: RoomComponent): number {
  let height = 50; // Base height
  
  // Add space for description
  if (component.description) {
    const splitDesc = doc.splitTextToSize(component.description, 170);
    height += splitDesc.length * 7;
  }
  
  // Add space for condition summary
  if (component.conditionSummary) {
    const splitSummary = doc.splitTextToSize(component.conditionSummary, 170);
    height += (splitSummary.length * 7) + 12;
  }
  
  // Add space for notes
  if (component.notes) {
    const splitNotes = doc.splitTextToSize(component.notes, 170);
    height += (splitNotes.length * 7) + 12;
  }
  
  // We won't add space for images here since they're handled separately
  // and can span multiple pages
  
  return height;
}
