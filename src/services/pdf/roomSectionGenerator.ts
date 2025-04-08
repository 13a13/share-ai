
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
    // For now, we'll just add a placeholder for images
    // In a real implementation, you would load and embed the actual images
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(20, yPosition, 170, 20, 3, 3, "F");
    
    doc.setFontSize(pdfFontSizes.small);
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    doc.text(`This component has ${component.images.length} image(s)`, 105, yPosition + 10, { align: "center" });
    
    yPosition += 30;
  }
  
  return yPosition;
}
