
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
  
  // Elegant header with company logo placeholder
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.rect(0, 0, pageWidth, 60, "F");
  
  // Logo placeholder (top left corner)
  doc.setDrawColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setLineWidth(0.5);
  doc.rect(pdfMargins.page, 15, 30, 30, "S");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.small);
  doc.text("LOGO", pdfMargins.page + 15, 30, { align: "center" });
  
  // Title text
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.title + 6);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("PROPERTY INVENTORY REPORT", pageWidth / 2, 30, { align: "center" });
  
  // Subtle accent strip
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.rect(0, 60, pageWidth, 5, "F");
  
  // Report type badge
  createElegantBox(doc, 50, 80, pageWidth - 100, 24, 5);
  
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text(`${capitalizeWords(report.type)} REPORT`, pageWidth / 2, 96, { align: "center" });
  
  // Property Details Card
  createElegantBox(doc, pdfMargins.page, 120, pageWidth - (pdfMargins.page * 2), 80, 4);
  
  // Property Details Header
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(pdfMargins.page, 120, pageWidth - (pdfMargins.page * 2), 20, 4, 4, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("PROPERTY DETAILS", pageWidth / 2, 134, { align: "center" });
  
  // Property Details Content
  const leftCol = pdfMargins.page + 10;
  const rightCol = leftCol + 60;
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  // Left column labels
  doc.setFont(pdfFonts.body, "bold");
  doc.text("Address:", leftCol, 150);
  doc.text("City:", leftCol, 162);
  doc.text("State:", leftCol, 174);
  doc.text("Zip Code:", leftCol, 186);
  
  // Right column values
  doc.setFont(pdfFonts.body, "normal");
  doc.text(property.address, rightCol, 150);
  doc.text(property.city, rightCol, 162);
  doc.text(property.state, rightCol, 174);
  doc.text(property.zipCode, rightCol, 186);
  
  // Report Information Card
  createElegantBox(doc, pdfMargins.page, 210, pageWidth - (pdfMargins.page * 2), 60, 4);
  
  // Report Info Header
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.roundedRect(pdfMargins.page, 210, pageWidth - (pdfMargins.page * 2), 20, 4, 4, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("REPORT INFORMATION", pageWidth / 2, 224, { align: "center" });
  
  // Report Information Content
  if (report.reportInfo) {
    // Left column labels
    doc.setFont(pdfFonts.body, "bold");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    doc.text("Report Date:", leftCol, 240);
    doc.text("Inspector:", leftCol, 252);
    
    // Right column values
    doc.setFont(pdfFonts.body, "normal");
    doc.text(
      report.reportInfo.reportDate ? formatDate(report.reportInfo.reportDate) : "Not specified", 
      rightCol, 240
    );
    doc.text(report.reportInfo.clerk || "Not specified", rightCol, 252);
    
    const secondColStart = pageWidth / 2 + 10;
    
    // Status in right half
    doc.setFont(pdfFonts.body, "bold");
    doc.text("Status:", secondColStart, 240);
    doc.setFont(pdfFonts.body, "normal");
    doc.text(capitalizeWords(report.status), secondColStart + 50, 240);
    
    // Tenant in right half if present
    if (report.reportInfo.tenantName) {
      doc.setFont(pdfFonts.body, "bold");
      doc.text("Tenant:", secondColStart, 252);
      doc.setFont(pdfFonts.body, "normal");
      doc.text(report.reportInfo.tenantName, secondColStart + 50, 252);
    }
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.setLineWidth(0.5);
  doc.line(pdfMargins.page, pageHeight - 25, pageWidth - pdfMargins.page, pageHeight - 25);
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text(`Report ID: ${report.id}`, pdfMargins.page, pageHeight - 15);
  
  // Branding
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Share.AI Property Reports", pageWidth - pdfMargins.page, pageHeight - 15, { align: "right" });
}
