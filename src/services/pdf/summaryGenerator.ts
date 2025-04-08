
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfColors, pdfFontSizes } from "./pdfStyles";

export function generateSummaryAndDisclaimers(
  doc: jsPDF, 
  report: Report,
  property: Property
): void {
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.text("SUMMARY & DISCLAIMERS", 105, 20, { align: "center" });
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  // Summary
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.text("Report Summary", 20, 40);
  doc.setFontSize(pdfFontSizes.normal);
  
  const summaryText = `This report includes an assessment of ${report.rooms.length} room(s) at the property located at ${property.address}, ${property.city}, ${property.state} ${property.zipCode}. The inspection was conducted on ${report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "an unspecified date"}.`;
  
  const splitSummary = doc.splitTextToSize(summaryText, 170);
  doc.text(splitSummary, 20, 50);
  
  // Disclaimers
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.text("Disclaimers", 20, 70);
  doc.setFontSize(pdfFontSizes.normal);
  
  let disclaimerY = 80;
  
  if (report.disclaimers && report.disclaimers.length > 0) {
    for (const disclaimer of report.disclaimers) {
      const splitDisclaimer = doc.splitTextToSize(`• ${disclaimer}`, 170);
      doc.text(splitDisclaimer, 20, disclaimerY);
      disclaimerY += splitDisclaimer.length * 7;
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
      const splitDisclaimer = doc.splitTextToSize(`• ${disclaimer}`, 170);
      doc.text(splitDisclaimer, 20, disclaimerY);
      disclaimerY += splitDisclaimer.length * 7;
    }
  }
  
  // Signature section
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.text("Signatures", 20, 200);
  
  doc.line(20, 220, 90, 220); // Inspector signature line
  doc.line(120, 220, 190, 220); // Client signature line
  
  doc.setFontSize(pdfFontSizes.small);
  doc.text("Inspector", 55, 230);
  doc.text("Client", 155, 230);
}
