
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { pdfColors, pdfFontSizes } from "./pdfStyles";

export function generateTableOfContents(
  doc: jsPDF, 
  report: Report,
  roomPageMap: Record<string, number>
): void {
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.text("TABLE OF CONTENTS", 105, 20, { align: "center" });
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  // List rooms with page numbers
  if (report.rooms.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Rooms:", 20, 40);
    doc.setFont("helvetica", "normal");
    
    report.rooms.forEach((room, index) => {
      const pageNumber = roomPageMap[room.id];
      doc.text(`${index + 1}. ${room.name}`, 30, 50 + (index * 10));
      doc.text(`Page ${pageNumber}`, 150, 50 + (index * 10));
    });
  } else {
    doc.text("No rooms in this report.", 20, 40);
  }
  
  // Add Summary section to TOC
  const summaryPageNumber = 3 + report.rooms.length; // Cover + TOC + all rooms
  doc.text("Summary and Disclaimers", 30, 50 + (report.rooms.length * 10));
  doc.text(`Page ${summaryPageNumber}`, 150, 50 + (report.rooms.length * 10));
}
