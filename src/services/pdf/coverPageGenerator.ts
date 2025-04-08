
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfColors, pdfFontSizes } from "./pdfStyles";

export function generateCoverPage(
  doc: jsPDF, 
  report: Report, 
  property: Property
): void {
  // COVER PAGE
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.rect(0, 0, 210, 30, "F");
  
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont("helvetica", "bold");
  doc.text("PROPERTY INVENTORY REPORT", 105, 20, { align: "center" });
  
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.text(`${report.type.replace('_', ' ').toUpperCase()} REPORT`, 105, 50, { align: "center" });
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont("helvetica", "normal");
  
  // Property Details
  doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.rect(20, 70, 170, 70, "F");
  
  doc.setFont("helvetica", "bold");
  doc.text("Property Details", 30, 85);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Address: ${property.address}`, 30, 95);
  doc.text(`City: ${property.city}`, 30, 105);
  doc.text(`State: ${property.state}`, 30, 115);
  doc.text(`Zip Code: ${property.zipCode}`, 30, 125);
  
  // Report Information
  if (report.reportInfo) {
    doc.setFont("helvetica", "bold");
    doc.text("Report Information", 105, 85);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Report Date: ${report.reportInfo.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "Not specified"}`, 105, 95);
    doc.text(`Inspector: ${report.reportInfo.clerk || "Not specified"}`, 105, 105);
    doc.text(`Status: ${report.status.replace('_', ' ')}`, 105, 115);
    
    if (report.reportInfo.tenantName) {
      doc.text(`Tenant: ${report.reportInfo.tenantName}`, 105, 125);
    }
  }
  
  doc.setFontSize(pdfFontSizes.small);
  doc.text(`Report ID: ${report.id}`, 20, 280);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 285);
}
