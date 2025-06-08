
import { jsPDF } from "jspdf";
import { pdfStyles } from "../styles";

/**
 * Add headers and footers to all pages
 */
export function addHeadersAndFooters(doc: jsPDF, propertyTitle: string): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const footerPosition = pageHeight - 15; // Position footer 15mm from bottom
  const headerPosition = 10; // Position header 10mm from top
  
  // Skip the cover page (page 1)
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Header - property title
    doc.setFont(pdfStyles.fonts.header, "normal");
    doc.setFontSize(pdfStyles.fontSizes.small);
    doc.setTextColor(pdfStyles.colors.gray[0], pdfStyles.colors.gray[1], pdfStyles.colors.gray[2]);
    doc.text(propertyTitle, pageWidth / 2, headerPosition, { align: "center" });
    
    // Header underline
    doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
    doc.setLineWidth(0.5);
    doc.line(pdfStyles.margins.page, headerPosition + 2, pageWidth - pdfStyles.margins.page, headerPosition + 2);
    
    // Footer separator line
    doc.line(pdfStyles.margins.page, footerPosition - 5, pageWidth - pdfStyles.margins.page, footerPosition - 5);
    
    // Footer - page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, footerPosition, { align: "center" });
  }
}
