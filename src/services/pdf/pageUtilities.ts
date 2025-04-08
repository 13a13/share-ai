
import { jsPDF } from "jspdf";
import { pdfColors, pdfFontSizes, pdfFonts, pdfMargins } from "./pdfStyles";

export class PageUtils {
  private currentPage: number = 1;
  private doc: jsPDF;
  private reportTitle: string;
  
  constructor(doc: jsPDF, reportTitle: string = "Property Inventory Report") {
    this.doc = doc;
    this.reportTitle = reportTitle;
  }
  
  /**
   * Adds header and footer to the current page - simplified design
   */
  addHeaderAndFooter(): void {
    // Footer on all pages except cover
    if (this.currentPage > 1) {
      const pageWidth = this.doc.internal.pageSize.width;
      const pageHeight = this.doc.internal.pageSize.height;
      
      // Simple separator line above footer
      this.doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
      this.doc.setLineWidth(0.5);
      this.doc.line(pdfMargins.page, pageHeight - 15, pageWidth - pdfMargins.page, pageHeight - 15);
      
      // Footer text - left aligned report title
      this.doc.setFontSize(pdfFontSizes.small);
      this.doc.setFont(pdfFonts.body, "normal");
      this.doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
      this.doc.text(
        this.reportTitle,
        pdfMargins.page,
        pageHeight - 8
      );
      
      // Page number - centered
      this.doc.setFont(pdfFonts.body, "normal");
      this.doc.text(
        `Page ${this.currentPage}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      
      // Date - right aligned
      this.doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pageWidth - pdfMargins.page,
        pageHeight - 8,
        { align: "right" }
      );
    }
    this.currentPage++;
  }
  
  /**
   * Calculate room page mapping for table of contents
   * @param roomIds Room IDs in the report
   * @returns Record mapping room IDs to page numbers
   */
  calculateRoomPageMap(roomIds: string[]): Record<string, number> {
    const roomPageMap: Record<string, number> = {};
    // Calculate the starting page number for rooms (cover + TOC)
    let pageCounter = 3;
    
    roomIds.forEach(roomId => {
      roomPageMap[roomId] = pageCounter;
      // Each room takes at least one page
      pageCounter++;
    });
    
    return roomPageMap;
  }
}
