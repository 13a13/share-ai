
import { jsPDF } from "jspdf";
import { pdfStyles } from "../styles";

/**
 * Add headers and footers to all pages
 */
export function addHeadersAndFooters(doc: jsPDF, propertyAddress: string): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Skip the cover page (page 1)
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Header - property address
    doc.setFont(pdfStyles.fonts.header, "normal");
    doc.setFontSize(pdfStyles.fontSizes.small);
    doc.setTextColor(pdfStyles.colors.gray[0], pdfStyles.colors.gray[1], pdfStyles.colors.gray[2]);
    doc.text(propertyAddress, pageWidth / 2, 10, { align: "center" });
    
    // Header underline
    doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
    doc.setLineWidth(0.5);
    doc.line(pdfStyles.margins.page, 12, pageWidth - pdfStyles.margins.page, 12);
    
    // Footer - page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    
    // Footer separator
    doc.line(pdfStyles.margins.page, pageHeight - 15, pageWidth - pdfStyles.margins.page, pageHeight - 15);
  }
}
