
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { 
  pdfColors, 
  pdfFontSizes, 
  pdfFonts, 
  pdfMargins, 
  createElegantBox, 
  createSeparator, 
  formatDate 
} from "./pdfStyles";

// Helper function to draw dashed lines since setLineDash is not available
function drawDashedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, dashLength: number = 2, spaceLength: number = 2) {
  const xDiff = x2 - x1;
  const yDiff = y2 - y1;
  const lineLength = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  const steps = Math.ceil(lineLength / (dashLength + spaceLength));
  const dashX = xDiff / steps;
  const dashY = yDiff / steps;
  
  let x = x1;
  let y = y1;
  
  doc.setLineWidth(0.5);
  
  for (let i = 0; i < steps; i += 2) {
    // Draw the dash
    doc.line(x, y, x + dashX, y + dashY);
    // Move to the start of the next dash
    x += (dashLength + spaceLength) / lineLength * xDiff;
    y += (dashLength + spaceLength) / lineLength * yDiff;
  }
}

export function generateSummaryAndDisclaimers(
  doc: jsPDF, 
  report: Report,
  property: Property
): void {
  const pageWidth = doc.internal.pageSize.width;
  
  // Header - simplified
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.rect(pdfMargins.page, pdfMargins.page, pageWidth - (pdfMargins.page * 2), 20, "F");
  
  doc.setFontSize(pdfFontSizes.title);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text("SUMMARY & DISCLAIMERS", pageWidth / 2, pdfMargins.page + 13, { align: "center" });
  
  let yPosition = pdfMargins.page + 30;
  
  // Summary section - simplified
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.1);
  doc.rect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 16, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.text("Report Summary", pdfMargins.page + 10, yPosition + 11);
  
  yPosition += 25;
  
  // Summary content
  doc.setFontSize(pdfFontSizes.normal);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  
  const summaryText = `This report includes an assessment of ${report.rooms.length} room(s) at the property located at ${property.address}, ${property.city}, ${property.state} ${property.zipCode}. The inspection was conducted on ${report.reportInfo?.reportDate ? formatDate(report.reportInfo.reportDate) : "an unspecified date"}.`;
  
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - (pdfMargins.page * 2) - 20);
  doc.text(splitSummary, pdfMargins.page + 10, yPosition);
  
  yPosition += splitSummary.length * 6 + 20;
  
  // Disclaimers section - simplified
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2], 0.1);
  doc.rect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 16, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.text("Disclaimers", pdfMargins.page + 10, yPosition + 11);
  
  yPosition += 25;
  
  const disclaimerStartX = pdfMargins.page + 10;
  
  if (report.disclaimers && report.disclaimers.length > 0) {
    doc.setFontSize(pdfFontSizes.normal);
    doc.setFont(pdfFonts.body, "normal");
    doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
    
    for (const disclaimer of report.disclaimers) {
      // Bullet point
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.circle(disclaimerStartX, yPosition, 1.5, "F");
      
      const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - (pdfMargins.page * 2) - 15);
      doc.text(splitDisclaimer, disclaimerStartX + 5, yPosition);
      yPosition += splitDisclaimer.length * 6 + 5;
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
      doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.circle(disclaimerStartX, yPosition, 1.5, "F");
      
      const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - (pdfMargins.page * 2) - 15);
      doc.text(splitDisclaimer, disclaimerStartX + 5, yPosition);
      yPosition += splitDisclaimer.length * 6 + 5;
    }
  }
  
  yPosition += 20;
  
  // Signature section - simplified
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.rect(pdfMargins.page, yPosition, pageWidth - (pdfMargins.page * 2), 60, "F");
  
  doc.setFontSize(pdfFontSizes.subtitle);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text("Signatures", pageWidth / 2, yPosition + 15, { align: "center" });
  
  const colWidth = (pageWidth - (pdfMargins.page * 2)) / 2;
  
  // Inspector signature - left side
  doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.rect(pdfMargins.page + 10, yPosition + 25, colWidth - 20, 25, "F");
  
  // Signature line - dashed - using our custom function
  doc.setDrawColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  drawDashedLine(
    doc, 
    pdfMargins.page + 15, 
    yPosition + 40, 
    pdfMargins.page + colWidth - 15, 
    yPosition + 40
  );
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text("Inspector's Signature", pdfMargins.page + (colWidth / 2), yPosition + 50, { align: "center" });
  
  // Client signature - right side
  doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.rect(pdfMargins.page + colWidth + 10, yPosition + 25, colWidth - 20, 25, "F");
  
  // Signature line - dashed - using our custom function
  doc.setDrawColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  drawDashedLine(
    doc,
    pdfMargins.page + colWidth + 15, 
    yPosition + 40, 
    pdfMargins.page + (colWidth * 2) - 15, 
    yPosition + 40
  );
  
  doc.setFontSize(pdfFontSizes.small);
  doc.setFont(pdfFonts.body, "normal");
  doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
  doc.text("Client's Signature", pdfMargins.page + (colWidth * 1.5), yPosition + 50, { align: "center" });
}
