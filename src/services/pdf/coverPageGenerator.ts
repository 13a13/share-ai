
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfColors, pdfFontSizes, pdfFonts } from "./pdfStyles";

export function generateCoverPage(
  doc: jsPDF, 
  report: Report, 
  property: Property
): void {
  // Header with gradient-like effect
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.rect(0, 0, 210, 60, "F");
  
  // Accent strip
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.rect(0, 60, 210, 10, "F");
  
  // Title text
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.title + 8); // Larger title
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("PROPERTY INVENTORY", 105, 30, { align: "center" });
  doc.text("REPORT", 105, 50, { align: "center" });
  
  // Report type badge
  doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.roundedRect(55, 80, 100, 20, 5, 5, "F");
  
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.text(`${report.type.replace('_', ' ').toUpperCase()} REPORT`, 105, 94, { align: "center" });
  
  // Property Details Card
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(25, 120, 160, 80, 8, 8, "F");
  
  // Property Details Header
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.roundedRect(25, 120, 160, 20, 8, 8, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("PROPERTY DETAILS", 105, 134, { align: "center" });
  
  // Property Details Content
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  // Left column
  doc.setFont(pdfFonts.body, "bold");
  doc.text("Address:", 35, 150);
  doc.text("City:", 35, 160);
  doc.text("State:", 35, 170);
  doc.text("Zip Code:", 35, 180);
  
  // Right column values
  doc.setFont(pdfFonts.body, "normal");
  doc.text(property.address, 85, 150);
  doc.text(property.city, 85, 160);
  doc.text(property.state, 85, 170);
  doc.text(property.zipCode, 85, 180);
  
  // Report Information Card
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(25, 210, 160, 60, 8, 8, "F");
  
  // Report Info Header
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.roundedRect(25, 210, 160, 20, 8, 8, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.text("REPORT INFORMATION", 105, 224, { align: "center" });
  
  // Report Information Content
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  if (report.reportInfo) {
    // Left column labels
    doc.setFont(pdfFonts.body, "bold");
    doc.text("Report Date:", 35, 240);
    doc.text("Inspector:", 35, 250);
    doc.text("Status:", 35, 260);
    
    // Right column values
    doc.setFont(pdfFonts.body, "normal");
    doc.text(report.reportInfo.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "Not specified", 85, 240);
    doc.text(report.reportInfo.clerk || "Not specified", 85, 250);
    doc.text(report.status.replace('_', ' '), 85, 260);
    
    if (report.reportInfo.tenantName) {
      doc.setFont(pdfFonts.body, "bold");
      doc.text("Tenant:", 120, 240);
      doc.setFont(pdfFonts.body, "normal");
      doc.text(report.reportInfo.tenantName, 155, 240);
    }
  }
  
  // Footer
  doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.rect(0, 280, 210, 17, "F");
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text(`Report ID: ${report.id}`, 20, 288);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 293);
  
  // Branding
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Share.AI Property Reports", 190, 290, { align: "right" });
}
