
import { jsPDF } from "jspdf";
import { Room, RoomComponent } from "@/types";
import { pdfColors, pdfFontSizes, getConditionColor, pdfFonts, createSectionBox } from "./pdfStyles";

export function generateRoomSection(
  doc: jsPDF, 
  room: Room,
  addHeaderAndFooter: () => void
): void {
  // Room Header with improved styling
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.roundedRect(15, 15, 180, 20, 5, 5, "F");
  
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(room.name, 105, 28, { align: "center" });
  
  // Room type badge
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.roundedRect(75, 40, 60, 10, 5, 5, "F");
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "bold");
  doc.text(`${room.type.replace('_', ' ').toUpperCase()}`, 105, 47, { align: "center" });
  
  let yPosition = 60;
  
  // General Condition Section
  if (room.generalCondition) {
    doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
    doc.roundedRect(15, yPosition, 180, 40, 5, 5, "F");
    
    doc.setFontSize(pdfFontSizes.subtitle);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("General Condition", 25, yPosition + 15);
    
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "normal");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    
    // Split long text into multiple lines
    const splitCondition = doc.splitTextToSize(room.generalCondition, 160);
    doc.text(splitCondition, 25, yPosition + 25);
    
    yPosition += 50; // Adjust based on content
  }
  
  // Components Section
  if (room.components && room.components.length > 0) {
    doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.1);
    doc.roundedRect(15, yPosition, 180, 15, 5, 5, "F");
    
    doc.setFontSize(pdfFontSizes.subtitle);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
    doc.text("Room Components", 105, yPosition + 10, { align: "center" });
    
    yPosition += 25;
    
    // Process each component
    for (const component of room.components) {
      yPosition = generateComponentSection(doc, component, yPosition, addHeaderAndFooter);
    }
  } else {
    doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
    doc.roundedRect(15, yPosition, 180, 30, 5, 5, "F");
    
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "italic");
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    doc.text("No components have been added to this room.", 105, yPosition + 15, { align: "center" });
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
  
  // Calculate component box height
  const boxHeight = calculateComponentBoxHeight(doc, component);
  
  // Component box with enhanced styling
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(15, yPosition, 180, boxHeight, 5, 5, "F");
  
  // Component title and condition badge in header box with gradient-like effect
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(15, yPosition, 180, 16, 5, 5, "F");
  
  // Component name
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(component.name, 25, yPosition + 11);
  
  // Condition badge with improved styling
  if (component.condition) {
    const conditionColorArray = getConditionColor(component.condition);
    
    doc.setFillColor(conditionColorArray[0], conditionColorArray[1], conditionColorArray[2]);
    doc.roundedRect(150, yPosition + 4, 40, 9, 4, 4, "F");
    doc.setFontSize(pdfFontSizes.small);
    doc.setFont(pdfFonts.body, "bold");
    doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
    doc.text(component.condition.toUpperCase(), 170, yPosition + 10, { align: "center" });
  }
  
  let contentYPosition = yPosition + 25;
  
  // Component description with improved styling
  if (component.description) {
    const splitDesc = doc.splitTextToSize(component.description, 160);
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "normal");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    doc.text(splitDesc, 25, contentYPosition);
    contentYPosition += splitDesc.length * 7;
  }
  
  // Condition summary if available
  if (component.conditionSummary) {
    // Section box for condition summary
    doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2], 0.5);
    doc.roundedRect(25, contentYPosition + 5, 160, 7 + (doc.splitTextToSize(component.conditionSummary, 150).length * 7), 3, 3, "F");
    
    doc.setFont(pdfFonts.heading, "bold");
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("Condition Summary:", 35, contentYPosition + 10);
    
    doc.setFont(pdfFonts.body, "normal");
    doc.setFontSize(pdfFontSizes.normal);
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    
    const splitSummary = doc.splitTextToSize(component.conditionSummary, 150);
    doc.text(splitSummary, 35, contentYPosition + 17);
    contentYPosition += (splitSummary.length * 7) + 22;
  } else {
    contentYPosition += 5;
  }
  
  // Component notes with improved styling
  if (component.notes) {
    // Notes box
    doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.1);
    doc.roundedRect(25, contentYPosition + 5, 160, 7 + (doc.splitTextToSize(component.notes, 150).length * 7), 3, 3, "F");
    
    doc.setFont(pdfFonts.heading, "bold");
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
    doc.text("Notes:", 35, contentYPosition + 10);
    
    doc.setFont(pdfFonts.body, "italic");
    doc.setFontSize(pdfFontSizes.normal);
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    
    const splitNotes = doc.splitTextToSize(component.notes, 150);
    doc.text(splitNotes, 35, contentYPosition + 17);
    contentYPosition += (splitNotes.length * 7) + 22;
  } else {
    contentYPosition += 5;
  }
  
  // Add component images if they exist with improved layout
  if (component.images && component.images.length > 0) {
    // Check if we need a new page for images
    if (contentYPosition > 200) {
      doc.addPage();
      addHeaderAndFooter();
      contentYPosition = 20;
      
      // Add component name as a header on the new page
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.roundedRect(15, contentYPosition, 180, 16, 5, 5, "F");
      
      doc.setFontSize(pdfFontSizes.header);
      doc.setFont(pdfFonts.heading, "bold");
      doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
      doc.text(`${component.name} (Images)`, 25, contentYPosition + 11);
      contentYPosition += 25;
    } else {
      // Add images section header
      doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2], 0.1);
      doc.roundedRect(25, contentYPosition, 160, 15, 3, 3, "F");
      
      doc.setFontSize(pdfFontSizes.subheader);
      doc.setFont(pdfFonts.heading, "bold");
      doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
      doc.text("Component Images", 105, contentYPosition + 10, { align: "center" });
      contentYPosition += 20;
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
        doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
        doc.roundedRect(15, contentYPosition, 180, 16, 5, 5, "F");
        
        doc.setFontSize(pdfFontSizes.header);
        doc.setFont(pdfFonts.heading, "bold");
        doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
        doc.text(`${component.name} (Images)`, 25, contentYPosition + 11);
        contentYPosition += 25;
      }
      
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index < component.images.length) {
          const image = component.images[index];
          const xPos = 25 + col * 85;
          
          try {
            // Image container with border
            doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(xPos, contentYPosition, 75, 65, 3, 3, "S");
            
            // Add image to PDF with rounded corners effect (approximated)
            doc.addImage(
              image.url,         // URL or base64 string
              'JPEG',            // Format (JPEG, PNG, etc.)
              xPos + 2.5,        // X position
              contentYPosition + 2.5, // Y position
              70,                // Width
              50                 // Height
            );
            
            // Add timestamp container
            doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
            doc.roundedRect(xPos, contentYPosition + 52.5, 75, 12.5, 0, 0, "F");
            
            // Add timestamp under the image
            const date = new Date(image.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            doc.setFontSize(pdfFontSizes.small);
            doc.setFont(pdfFonts.body, "normal");
            doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
            doc.text(formattedDate, xPos + 37.5, contentYPosition + 60, { align: "center" });
          } catch (error) {
            console.error("Error adding image to PDF:", error);
            
            // Add error placeholder with improved styling
            doc.setFillColor(220, 220, 220);
            doc.roundedRect(xPos, contentYPosition, 75, 65, 3, 3, "F");
            
            doc.setFont(pdfFonts.body, "italic");
            doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
            doc.text("Image loading error", xPos + 37.5, contentYPosition + 32.5, { align: "center" });
          }
        }
      }
      contentYPosition += 75; // Move down for the next row of images with spacing
    }
  }
  
  return contentYPosition + 15; // Add spacing between components
}

// Helper function to calculate component box height
function calculateComponentBoxHeight(doc: jsPDF, component: RoomComponent): number {
  let height = 60; // Base height with improved spacing
  
  // Add space for description
  if (component.description) {
    const splitDesc = doc.splitTextToSize(component.description, 160);
    height += splitDesc.length * 7;
  }
  
  // Add space for condition summary
  if (component.conditionSummary) {
    const splitSummary = doc.splitTextToSize(component.conditionSummary, 150);
    height += (splitSummary.length * 7) + 22; // Extra padding for section
  }
  
  // Add space for notes
  if (component.notes) {
    const splitNotes = doc.splitTextToSize(component.notes, 150);
    height += (splitNotes.length * 7) + 22; // Extra padding for section
  }
  
  // We won't add space for images here since they're handled separately
  // and can span multiple pages
  
  return height;
}
