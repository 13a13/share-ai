
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { 
  pdfColors, 
  pdfFontSizes, 
  pdfFonts, 
  pdfMargins, 
  createElegantBox, 
  formatDate, 
  capitalizeWords 
} from "./pdfStyles";

export function generateCoverPage(
  doc: jsPDF, 
  report: Report, 
  property: Property
): void {
  const pageWidth = doc.internal.pageSize.width;
  
  // Clean header with gradient-like effect
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.rect(0, 0, pageWidth, 50, "F");
  
  // Title text
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.title + 4);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("PROPERTY INVENTORY REPORT", pageWidth / 2, 30, { align: "center" });
  
  // Simple accent strip
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.rect(0, 50, pageWidth, 3, "F");
  
  // Report type badge
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.roundedRect(pageWidth / 2 - 50, 70, 100, 20, 3, 3, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text(`${capitalizeWords(report.type)} REPORT`, pageWidth / 2, 83, { align: "center" });
  
  // Property Details Card - simplified
  createElegantBox(doc, pdfMargins.page, 110, pageWidth - (pdfMargins.page * 2), 70, 3);
  
  // Property Details Header
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(pdfMargins.page, 110, pageWidth - (pdfMargins.page * 2), 16, 3, 3, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("PROPERTY DETAILS", pageWidth / 2, 121, { align: "center" });
  
  // Property Details Content
  const leftCol = pdfMargins.page + 10;
  const rightCol = leftCol + 40;
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  // Left column labels
  doc.setFont(pdfFonts.body, "bold");
  doc.text("Address:", leftCol, 140);
  doc.text("City:", leftCol, 150);
  doc.text("State:", leftCol, 160);
  doc.text("Zip Code:", leftCol, 170);
  
  // Right column values
  doc.setFont(pdfFonts.body, "normal");
  doc.text(property.address, rightCol, 140);
  doc.text(property.city, rightCol, 150);
  doc.text(property.state, rightCol, 160);
  doc.text(property.zipCode, rightCol, 170);
  
  // Report Information Card - simplified
  createElegantBox(doc, pdfMargins.page, 190, pageWidth - (pdfMargins.page * 2), 50, 3);
  
  // Report Info Header
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.roundedRect(pdfMargins.page, 190, pageWidth - (pdfMargins.page * 2), 16, 3, 3, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("REPORT INFORMATION", pageWidth / 2, 201, { align: "center" });
  
  // Report Information Content
  if (report.reportInfo) {
    // Left column
    doc.setFont(pdfFonts.body, "bold");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    doc.text("Report Date:", leftCol, 220);
    
    // Right column values
    doc.setFont(pdfFonts.body, "normal");
    doc.text(
      report.reportInfo.reportDate ? formatDate(report.reportInfo.reportDate) : "Not specified", 
      rightCol, 220
    );
    
    // Second row
    doc.setFont(pdfFonts.body, "bold");
    doc.text("Inspector:", leftCol, 230);
    doc.setFont(pdfFonts.body, "normal");
    doc.text(report.reportInfo.clerk || "Not specified", rightCol, 230);
    
    // Status on right side
    const secondColStart = pageWidth / 2 + 10;
    doc.setFont(pdfFonts.body, "bold");
    doc.text("Status:", secondColStart, 220);
    doc.setFont(pdfFonts.body, "normal");
    doc.text(capitalizeWords(report.status), secondColStart + 30, 220);
    
    // Tenant on right side if present
    if (report.reportInfo.tenantName) {
      doc.setFont(pdfFonts.body, "bold");
      doc.text("Tenant:", secondColStart, 230);
      doc.setFont(pdfFonts.body, "normal");
      doc.text(report.reportInfo.tenantName, secondColStart + 30, 230);
    }
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.setLineWidth(0.5);
  doc.line(pdfMargins.page, pageHeight - 20, pageWidth - pdfMargins.page, pageHeight - 20);
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text(`Report ID: ${report.id}`, pdfMargins.page, pageHeight - 12);
  
  // Branding
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Share.AI Property Reports", pageWidth - pdfMargins.page, pageHeight - 12, { align: "right" });
}
