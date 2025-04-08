
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
  
  // Component box
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(15, yPosition, 180, 50, 3, 3, "F");
  
  // Component title
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text(component.name, 20, yPosition + 10);
  
  // Condition badge
  if (component.condition) {
    const conditionColorArray = getConditionColor(component.condition);
    const colorR = conditionColorArray[0];
    const colorG = conditionColorArray[1];
    const colorB = conditionColorArray[2];
    
    doc.setFillColor(colorR, colorG, colorB);
    doc.roundedRect(150, yPosition + 5, 40, 7, 2, 2, "F");
    doc.setFontSize(pdfFontSizes.small);
    doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
    doc.text(component.condition.toUpperCase(), 170, yPosition + 10, { align: "center" });
  }
  
  // Component description
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  if (component.description) {
    const splitDesc = doc.splitTextToSize(component.description, 170);
    doc.text(splitDesc, 20, yPosition + 20);
  }
  
  // Component notes
  if (component.notes) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    const splitNotes = doc.splitTextToSize(`Notes: ${component.notes}`, 170);
    doc.text(splitNotes, 20, yPosition + 35);
  }
  
  // Move down for the next component
  yPosition += 60;
  
  // Add component images if they exist
  if (component.images && component.images.length > 0) {
    // Calculate how many images to show per row (2 images per row)
    const imagesPerRow = 2;
    const rows = Math.ceil(component.images.length / imagesPerRow);
    
    // Add a label for images
    doc.setFontSize(pdfFontSizes.small);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    doc.text("Images:", 20, yPosition);
    
    yPosition += 5;
    
    for (let row = 0; row < rows; row++) {
      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage();
        addHeaderAndFooter();
        yPosition = 20;
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
            
            // Create image element to get dimensions
            const img = new Image();
            img.src = image.url;
            
            // Add image to PDF
            doc.addImage(
              image.url,       // URL or base64 string
              'JPEG',          // Format (JPEG, PNG, etc.)
              xPos,            // X position
              yPosition,       // Y position
              80,              // Width
              60               // Height
            );
            
            // Add timestamp under the image
            doc.setFontSize(pdfFontSizes.small);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
            doc.text(formattedDate, xPos + 40, yPosition + 65, { align: "center" });
          } catch (error) {
            console.error("Error adding image to PDF:", error);
            
            // Add error placeholder
            doc.setFillColor(220, 220, 220);
            doc.rect(xPos, yPosition, 80, 60, "F");
            doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
            doc.text("Image loading error", xPos + 40, yPosition + 30, { align: "center" });
          }
        }
      }
      yPosition += 70; // Move down for the next row of images
    }
  }
  
  return yPosition + 10; // Add some spacing between components
}
