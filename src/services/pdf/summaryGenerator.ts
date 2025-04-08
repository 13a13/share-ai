
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfColors, pdfFontSizes, pdfFonts } from "./pdfStyles";

export function generateSummaryAndDisclaimers(
  doc: jsPDF, 
  report: Report,
  property: Property
): void {
  // Header
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(15, 15, 180, 25, 5, 5, "F");
  
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text("SUMMARY & DISCLAIMERS", 105, 32, { align: "center" });
  
  // Summary section
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.1);
  doc.roundedRect(15, 50, 180, 15, 5, 5, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.text("Report Summary", 105, 60, { align: "center" });
  
  // Summary content
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  const summaryText = `This report includes an assessment of ${report.rooms.length} room(s) at the property located at ${property.address}, ${property.city}, ${property.state} ${property.zipCode}. The inspection was conducted on ${report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "an unspecified date"}.`;
  
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(15, 70, 180, 30, 5, 5, "F");
  
  const splitSummary = doc.splitTextToSize(summaryText, 170);
  doc.text(splitSummary, 25, 85);
  
  // Disclaimers
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2], 0.1);
  doc.roundedRect(15, 110, 180, 15, 5, 5, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.text("Disclaimers", 105, 120, { align: "center" });
  
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(15, 130, 180, 60, 5, 5, "F");
  
  let disclaimerY = 140;
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  if (report.disclaimers && report.disclaimers.length > 0) {
    for (const disclaimer of report.disclaimers) {
      // Bullet point styling
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
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
      // Bullet point styling
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.circle(20, disclaimerY, 1.5, "F");
      
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 165);
      doc.text(splitDisclaimer, 25, disclaimerY);
      disclaimerY += splitDisclaimer.length * 7 + 5;
    }
  }
  
  // Signature section
  doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.roundedRect(15, 200, 180, 70, 5, 5, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Signatures", 105, 215, { align: "center" });
  
  // Inspector signature
  doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.roundedRect(25, 225, 70, 35, 3, 3, "F");
  
  doc.line(30, 245, 90, 245); // Inspector signature line
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text("Inspector", 60, 255, { align: "center" });
  
  // Client signature
  doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.roundedRect(115, 225, 70, 35, 3, 3, "F");
  
  doc.line(120, 245, 180, 245); // Client signature line
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text("Client", 150, 255, { align: "center" });
}
