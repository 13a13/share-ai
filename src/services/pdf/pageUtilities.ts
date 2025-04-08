
import { jsPDF } from "jspdf";
import { pdfColors, pdfFontSizes } from "./pdfStyles";

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
      this.doc.setFontSize(pdfFontSizes.small);
      this.doc.setTextColor(pdfColors.gray[0], pdfColors.gray[1], pdfColors.gray[2]);
      this.doc.text(
        `Share.AI Property Report - Page ${this.currentPage}`,
        pageWidth / 2,
        285,
        { align: "center" }
      );
      this.doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        290,
        { align: "center" }
      );
    }
    this.currentPage++;
  }
  
  /**
   * Calculate room page mapping for table of contents
   * @param roomCount Number of rooms in the report
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
