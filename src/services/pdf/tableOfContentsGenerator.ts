
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { pdfColors, pdfFontSizes, pdfFonts, createElegantBox } from "./pdfStyles";

export function generateTableOfContents(
  doc: jsPDF, 
  report: Report,
  roomPageMap: Record<string, number>
): void {
  // Header - more elegant styling
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2], 0.9);
  doc.roundedRect(15, 15, 180, 25, 6, 6, "F");
  
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text("TABLE OF CONTENTS", 105, 32, { align: "center" });
  
  // Table of contents content
  doc.setFontSize(pdfFontSizes.normal);
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  // List rooms with page numbers
  if (report.rooms.length > 0) {
    // Rooms section header - more subtle coloring
    doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.15);
    doc.roundedRect(15, 50, 180, 15, 6, 6, "F");
    
    doc.setFontSize(pdfFontSizes.subtitle);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
    doc.text("Rooms", 105, 60, { align: "center" });
    
    // Table header - softer styling
    doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
    doc.rect(30, 75, 150, 10, "F");
    
    doc.setFontSize(pdfFontSizes.subheader);
    doc.setFont(pdfFonts.heading, "bold");
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("Room Name", 40, 82);
    doc.text("Page", 165, 82, { align: "center" });
    
    // Room list - alternating subtle backgrounds
    report.rooms.forEach((room, index) => {
      const yPos = 85 + (index * 10);
      const pageNumber = roomPageMap[room.id];
      
      // Alternate row background - more subtle
      if (index % 2 === 0) {
        doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
        doc.rect(30, yPos, 150, 10, "F");
      }
      
      doc.setFontSize(pdfFontSizes.normal);
      doc.setFont(pdfFonts.body, "normal");
      doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
      doc.text(`${index + 1}. ${room.name}`, 40, yPos + 7);
      
      // Page number in a circle - softer styling
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2], 0.9);
      doc.circle(165, yPos + 5, 6, "F");
      
      doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
      doc.setFont(pdfFonts.body, "bold");
      doc.text(`${pageNumber}`, 165, yPos + 7, { align: "center" });
    });
  } else {
    // Empty state - more elegant
    createElegantBox(doc, 30, 75, 150, 20);
    
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "italic");
    doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
    doc.text("No rooms in this report.", 105, 88, { align: "center" });
  }
  
  // Summary and Disclaimers section
  const summaryYPos = report.rooms.length > 0 ? 95 + (report.rooms.length * 10) : 105;
  const summaryPageNumber = 3 + report.rooms.length; // Cover + TOC + all rooms
  
  // Softer section header
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2], 0.15);
  doc.roundedRect(15, summaryYPos, 180, 15, 6, 6, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.text("Additional Sections", 105, summaryYPos + 10, { align: "center" });
  
  // Table for additional sections - softer
  doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.rect(30, summaryYPos + 25, 150, 10, "F");
  
  doc.setFontSize(pdfFontSizes.subheader);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Section", 40, summaryYPos + 32);
  doc.text("Page", 165, summaryYPos + 32, { align: "center" });
  
  // Summary and Disclaimers row
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  doc.text("Summary and Disclaimers", 40, summaryYPos + 42);
  
  // Page number in a circle - softer styling
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2], 0.9);
  doc.circle(165, summaryYPos + 40, 6, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFont(pdfFonts.body, "bold");
  doc.text(`${summaryPageNumber}`, 165, summaryYPos + 42, { align: "center" });
}
