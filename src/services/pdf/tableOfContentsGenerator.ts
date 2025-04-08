
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { 
  pdfColors, 
  pdfFontSizes, 
  pdfFonts, 
  pdfMargins, 
  createElegantBox, 
  createSeparator 
} from "./pdfStyles";

export function generateTableOfContents(
  doc: jsPDF, 
  report: Report,
  roomPageMap: Record<string, number>
): void {
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(pdfMargins.page, pdfMargins.page, pageWidth - (pdfMargins.page * 2), 25, 4, 4, "F");
  
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text("TABLE OF CONTENTS", pageWidth / 2, pdfMargins.page + 16, { align: "center" });
  
  // Table of contents content
  let yPosition = pdfMargins.page + 40;
  
  // List rooms with page numbers
  if (report.rooms.length > 0) {
    // Rooms section header
    doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2], 0.1);
    doc.roundedRect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 20, 4, 4, "F");
    
    doc.setFontSize(pdfFontSizes.subtitle);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    doc.text("Rooms", pageWidth / 2, yPosition + 14, { align: "center" });
    
    yPosition += 30;
    
    // Table header
    doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
    doc.rect(pdfMargins.page + 10, yPosition, pageWidth - (pdfMargins.page * 2) - 20, 12, "F");
    
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("Room Name", pdfMargins.page + 20, yPosition + 8);
    doc.text("Page", pageWidth - pdfMargins.page - 20, yPosition + 8, { align: "center" });
    
    yPosition += 12;
    
    // Room list with alternating backgrounds
    report.rooms.forEach((room, index) => {
      const rowHeight = 12;
      const pageNumber = roomPageMap[room.id];
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.3);
        doc.rect(pdfMargins.page + 10, yPosition, pageWidth - (pdfMargins.page * 2) - 20, rowHeight, "F");
      }
      
      // Room icon/bullet
      doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
      doc.circle(pdfMargins.page + 15, yPosition + 6, 2, "F");
      
      // Room name
      doc.setFontSize(pdfFontSizes.normal);
      doc.setFont(pdfFonts.body, "normal");
      doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
      doc.text(`${room.name}`, pdfMargins.page + 25, yPosition + 8);
      
      // Page number with dot leaders
      doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
      doc.setLineWidth(0.2);
      const dotsStartX = pdfMargins.page + 25 + doc.getTextWidth(room.name) + 5;
      const dotsEndX = pageWidth - pdfMargins.page - 35;
      doc.line(dotsStartX, yPosition + 6, dotsEndX, yPosition + 6);
      
      // Page number in a circle
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.circle(pageWidth - pdfMargins.page - 20, yPosition + 6, 8, "F");
      
      doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
      doc.setFont(pdfFonts.body, "bold");
      doc.text(`${pageNumber}`, pageWidth - pdfMargins.page - 20, yPosition + 8, { align: "center" });
      
      yPosition += rowHeight;
    });
  } else {
    // Empty state
    createElegantBox(doc, pdfMargins.page + 10, yPosition, pageWidth - (pdfMargins.page * 2) - 20, 25);
    
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "italic");
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    doc.text("No rooms in this report.", pageWidth / 2, yPosition + 15, { align: "center" });
    
    yPosition += 35;
  }
  
  // Additional sections separator
  yPosition = createSeparator(doc, yPosition + 10, pageWidth - (pdfMargins.page * 2));
  
  // Additional Sections header
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2], 0.1);
  doc.roundedRect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 20, 4, 4, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.text("Additional Sections", pageWidth / 2, yPosition + 14, { align: "center" });
  
  yPosition += 30;
  
  // Table for additional sections
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.rect(pdfMargins.page + 10, yPosition, pageWidth - (pdfMargins.page * 2) - 20, 12, "F");
  
  doc.setFontSize(pdfFontSizes.subheader);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Section", pdfMargins.page + 20, yPosition + 8);
  doc.text("Page", pageWidth - pdfMargins.page - 20, yPosition + 8, { align: "center" });
  
  yPosition += 12;
  
  // Summary and Disclaimers row
  const summaryPageNumber = 3 + report.rooms.length; // Cover + TOC + all rooms
  
  // Row background
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.3);
  doc.rect(pdfMargins.page + 10, yPosition, pageWidth - (pdfMargins.page * 2) - 20, 12, "F");
  
  // Section icon/bullet
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.circle(pdfMargins.page + 15, yPosition + 6, 2, "F");
  
  // Section name
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  doc.text("Summary and Disclaimers", pdfMargins.page + 25, yPosition + 8);
  
  // Dot leaders
  doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.setLineWidth(0.2);
  const dotsStartX = pdfMargins.page + 25 + doc.getTextWidth("Summary and Disclaimers") + 5;
  const dotsEndX = pageWidth - pdfMargins.page - 35;
  doc.line(dotsStartX, yPosition + 6, dotsEndX, yPosition + 6);
  
  // Page number in a circle
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.circle(pageWidth - pdfMargins.page - 20, yPosition + 6, 8, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFont(pdfFonts.body, "bold");
  doc.text(`${summaryPageNumber}`, pageWidth - pdfMargins.page - 20, yPosition + 8, { align: "center" });
}
