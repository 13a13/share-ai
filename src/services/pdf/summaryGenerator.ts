
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { 
  pdfColors, 
  pdfFontSizes, 
  pdfFonts, 
  pdfMargins, 
  createElegantBox, 
  createSeparator, 
  formatDate,
  drawDashedLine
} from "./pdfStyles";

export function generateSummaryAndDisclaimers(
  doc: jsPDF, 
  report: Report,
  property: Property
): void {
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(pdfMargins.page, pdfMargins.page, pageWidth - (pdfMargins.page * 2), 25, 4, 4, "F");
  
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text("SUMMARY & DISCLAIMERS", pageWidth / 2, pdfMargins.page + 16, { align: "center" });
  
  let yPosition = pdfMargins.page + 40;
  
  // Summary section
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2], 0.1);
  doc.roundedRect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 20, 4, 4, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.text("Report Summary", pageWidth / 2, yPosition + 14, { align: "center" });
  
  yPosition += 30;
  
  // Summary content in two-column layout
  const colWidth = (pageWidth - (pdfMargins.page * 2) - 10) / 2;
  
  // Left column - Summary
  createElegantBox(doc, pdfMargins.page, yPosition, colWidth, 80, 4);
  
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  const summaryText = `This report includes an assessment of ${report.rooms.length} room(s) at the property located at ${property.address}, ${property.city}, ${property.state} ${property.zipCode}. The inspection was conducted on ${report.reportInfo?.reportDate ? formatDate(report.reportInfo.reportDate) : "an unspecified date"}.`;
  
  const splitSummary = doc.splitTextToSize(summaryText, colWidth - 20);
  doc.text(splitSummary, pdfMargins.page + 10, yPosition + 20);
  
  // Right column - Disclaimers
  createElegantBox(doc, pdfMargins.page + colWidth + 10, yPosition, colWidth, 80, 4);
  
  let disclaimerY = yPosition + 15;
  
  doc.setFontSize(pdfFontSizes.subheader);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
  doc.text("Disclaimers", pdfMargins.page + colWidth + 20, disclaimerY);
  
  disclaimerY += 10;
  
  const disclaimerStartX = pdfMargins.page + colWidth + 20;
  
  if (report.disclaimers && report.disclaimers.length > 0) {
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "normal");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    
    for (const disclaimer of report.disclaimers) {
      // Bullet point
      doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
      doc.circle(disclaimerStartX, disclaimerY, 1.5, "F");
      
      const splitDisclaimer = doc.splitTextToSize(disclaimer, colWidth - 25);
      doc.text(splitDisclaimer, disclaimerStartX + 5, disclaimerY);
      disclaimerY += splitDisclaimer.length * 6 + 5;
    }
  } else {
    // Default disclaimers
    const defaultDisclaimers = [
      "This report represents the condition of the property at the time of inspection only.",
      "Areas not accessible for inspection are not included in this report.",
      "The inspector is not required to move furniture or personal items."
    ];
    
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "normal");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    
    for (const disclaimer of defaultDisclaimers) {
      // Bullet point
      doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
      doc.circle(disclaimerStartX, disclaimerY, 1.5, "F");
      
      const splitDisclaimer = doc.splitTextToSize(disclaimer, colWidth - 25);
      doc.text(splitDisclaimer, disclaimerStartX + 5, disclaimerY);
      disclaimerY += splitDisclaimer.length * 6 + 5;
    }
  }
  
  yPosition += 90;
  
  // Signature section
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.roundedRect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 80, 4, 4, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Signatures", pageWidth / 2, yPosition + 15, { align: "center" });
  
  // Inspector signature - left side
  createElegantBox(doc, pdfMargins.page + 20, yPosition + 25, colWidth - 40, 40, 4);
  
  // Signature line - dashed (using custom function)
  doc.setDrawColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.setLineWidth(0.5);
  // Using custom dashed line function instead of setLineDash
  drawDashedLine(
    doc, 
    pdfMargins.page + 30, 
    yPosition + 50, 
    pdfMargins.page + colWidth - 30, 
    yPosition + 50, 
    2, 
    2
  );
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text("Inspector's Signature", pdfMargins.page + 20 + (colWidth - 40) / 2, yPosition + 60, { align: "center" });
  
  // Client signature - right side
  createElegantBox(doc, pdfMargins.page + colWidth + 20, yPosition + 25, colWidth - 40, 40, 4);
  
  // Signature line - dashed (using custom function)
  doc.setDrawColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.setLineWidth(0.5);
  // Using custom dashed line function instead of setLineDash
  drawDashedLine(
    doc, 
    pdfMargins.page + colWidth + 30, 
    yPosition + 50, 
    pdfMargins.page + (colWidth * 2) - 30, 
    yPosition + 50, 
    2, 
    2
  );
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text("Client's Signature", pdfMargins.page + colWidth + 20 + (colWidth - 40) / 2, yPosition + 60, { align: "center" });
}
