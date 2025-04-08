
import { jsPDF } from "jspdf";
import { pdfColors, pdfFontSizes, pdfFonts } from "./pdfStyles";

export class PageUtils {
  private currentPage: number = 1;
  private doc: jsPDF;
  
  constructor(doc: jsPDF) {
    this.doc = doc;
  }
  
  /**
   * Adds header and footer to the current page
   */
  addHeaderAndFooter(): void {
    // Footer on all pages except cover
    if (this.currentPage > 1) {
      const pageWidth = this.doc.internal.pageSize.width;
      
      // Footer background
      this.doc.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
      this.doc.rect(0, 280, 210, 17, "F");
      
      // Page number
      this.doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      this.doc.circle(pageWidth / 2, 288, 8, "F");
      
      this.doc.setFontSize(pdfFontSizes.normal);
      this.doc.setFont(pdfFonts.heading, "bold");
      this.doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
      this.doc.text(`${this.currentPage}`, pageWidth / 2, 291, { align: "center" });
      
      // Footer text
      this.doc.setFontSize(pdfFontSizes.small);
      this.doc.setFont(pdfFonts.body, "normal");
      this.doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
      this.doc.text(
        `Share.AI Property Report`,
        20,
        288
      );
      this.doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        190,
        288,
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
