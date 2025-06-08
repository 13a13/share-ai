
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { pdfStyles } from "../styles";

/**
 * Generate table of contents with dot leaders
 */
export function generateTableOfContents(doc: jsPDF, pageMap: Record<string, number>, report?: Report | null): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("CONTENTS", margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + 40, margins + 15);
  
  let yPosition = margins + 30;
  
  // Standard sections
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  const standardSections = [
    { key: "disclaimer", label: "Disclaimer" },
    { key: "summary", label: "Summary" },
  ];
  
  for (const section of standardSections) {
    const pageNumber = pageMap[section.key] || "";
    const textWidth = doc.getTextWidth(section.label);
    const dotsWidth = pageWidth - margins * 2 - textWidth - 5;
    
    // Draw section name
    doc.text(section.label, margins, yPosition);
    
    // Calculate dot leaders
    const dotCount = Math.floor(dotsWidth / 2);
    let dots = "";
    for (let i = 0; i < dotCount; i++) {
      dots += ". ";
    }
    
    // Draw dot leaders and page number
    doc.text(dots, margins + textWidth + 3, yPosition);
    doc.text(pageNumber.toString(), pageWidth - margins, yPosition, { align: "right" });
    
    yPosition += 10;
  }
  
  // Rooms (if report provided)
  if (report && report.rooms.length > 0) {
    yPosition += 10;
    doc.setFont(pdfStyles.fonts.header, "bold");
    doc.text("Rooms", margins, yPosition);
    yPosition += 10;
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    
    report.rooms.forEach((room, index) => {
      const roomNum = index + 1;
      const roomLabel = `${roomNum}. ${room.name}`;
      const textWidth = doc.getTextWidth(roomLabel);
      const dotsWidth = pageWidth - margins * 2 - textWidth - 5;
      const pageNumber = pageMap[room.id] || "";
      
      // Draw room name
      doc.text(roomLabel, margins, yPosition);
      
      // Calculate dot leaders
      const dotCount = Math.floor(dotsWidth / 2);
      let dots = "";
      for (let i = 0; i < dotCount; i++) {
        dots += ". ";
      }
      
      // Draw dot leaders and page number
      doc.text(dots, margins + textWidth + 3, yPosition);
      doc.text(pageNumber.toString(), pageWidth - margins, yPosition, { align: "right" });
      
      yPosition += 10;
    });
  }
  
  // Final sections
  yPosition += 10;
  const finalSectionLabel = "Final Notes & Declarations";
  const textWidth = doc.getTextWidth(finalSectionLabel);
  const dotsWidth = pageWidth - margins * 2 - textWidth - 5;
  const pageNumber = pageMap["final"] || "";
  
  // Draw section name
  doc.text(finalSectionLabel, margins, yPosition);
  
  // Calculate dot leaders
  const dotCount = Math.floor(dotsWidth / 2);
  let dots = "";
  for (let i = 0; i < dotCount; i++) {
    dots += ". ";
  }
  
  // Draw dot leaders and page number
  doc.text(dots, margins + textWidth + 3, yPosition);
  doc.text(pageNumber.toString(), pageWidth - margins, yPosition, { align: "right" });
}
