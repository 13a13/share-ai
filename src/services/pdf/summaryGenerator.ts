
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfColors, pdfFontSizes, pdfFonts, createElegantBox } from "./pdfStyles";

export function generateSummaryAndDisclaimers(
  doc: jsPDF, 
  report: Report,
  property: Property
): void {
  // Header - more elegant styling
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2], 0.9);
  doc.roundedRect(15, 15, 180, 25, 6, 6, "F");
  
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text("SUMMARY & DISCLAIMERS", 105, 32, { align: "center" });
  
  // Summary section - more subtle styling
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.15);
  doc.roundedRect(15, 50, 180, 15, 6, 6, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.text("Report Summary", 105, 60, { align: "center" });
  
  // Summary content - elegant box
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  const summaryText = `This report includes an assessment of ${report.rooms.length} room(s) at the property located at ${property.address}, ${property.city}, ${property.state} ${property.zipCode}. The inspection was conducted on ${report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "an unspecified date"}.`;
  
  createElegantBox(doc, 15, 70, 180, 30, 5);
  
  const splitSummary = doc.splitTextToSize(summaryText, 170);
  doc.text(splitSummary, 25, 85);
  
  // Disclaimers - more subtle styling
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2], 0.15);
  doc.roundedRect(15, 110, 180, 15, 6, 6, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.text("Disclaimers", 105, 120, { align: "center" });
  
  // Elegant disclaimer box
  createElegantBox(doc, 15, 130, 180, 60, 5);
  
  let disclaimerY = 140;
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  if (report.disclaimers && report.disclaimers.length > 0) {
    for (const disclaimer of report.disclaimers) {
      // Bullet point styling - softer
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2], 0.8);
      doc.circle(20, disclaimerY, 1.5, "F");
      
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 165);
      doc.text(splitDisclaimer, 25, disclaimerY);
      disclaimerY += splitDisclaimer.length * 7 + 5;
    }
  } else {
    // Default disclaimers if none are provided
    const defaultDisclaimers = [
      "This report represents the condition of the property at the time of inspection only.",
      "Areas not accessible for inspection are not included in this report.",
      "The inspector is not required to move furniture or personal items.",
      "This report is not a warranty or guarantee of any kind."
    ];
    
    for (const disclaimer of defaultDisclaimers) {
      // Bullet point styling - softer
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2], 0.8);
      doc.circle(20, disclaimerY, 1.5, "F");
      
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 165);
      doc.text(splitDisclaimer, 25, disclaimerY);
      disclaimerY += splitDisclaimer.length * 7 + 5;
    }
  }
  
  // Signature section - elegant
  doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2], 0.5);
  doc.roundedRect(15, 200, 180, 70, 6, 6, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Signatures", 105, 215, { align: "center" });
  
  // Inspector signature - elegant boxes
  createElegantBox(doc, 25, 225, 70, 35, 4);
  
  // Signature line - softer
  doc.setDrawColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.setLineWidth(0.3);
  doc.line(30, 245, 90, 245);
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text("Inspector", 60, 255, { align: "center" });
  
  // Client signature - elegant box
  createElegantBox(doc, 115, 225, 70, 35, 4);
  
  // Signature line - softer
  doc.line(120, 245, 180, 245);
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text("Client", 150, 255, { align: "center" });
}
