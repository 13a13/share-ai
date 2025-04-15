
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { pdfStyles } from "../styles";

/**
 * Generate the table of contents for the PDF
 * @param doc PDF document
 * @param pageMap Map of section IDs to page numbers
 * @param report Report data (optional)
 */
export const generateTableOfContents = (
  doc: jsPDF, 
  pageMap: Record<string, number>,
  report?: Report
): void => {
  // Set title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(16);
  doc.setTextColor(pdfStyles.colors.primary[0], pdfStyles.colors.primary[1], pdfStyles.colors.primary[2]);
  doc.text("Contents", 14, 30);
  
  // Set up for table of contents entries
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(11);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  
  // Start position for entries
  let yPos = 45;
  
  // Function to add a table of contents entry
  const addEntry = (text: string, pageKey: string): void => {
    const page = pageMap[pageKey];
    if (!page) return;
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    doc.text(text, 20, yPos);
    
    // Add dots
    const textWidth = doc.getTextWidth(text);
    const pageNumWidth = doc.getTextWidth(String(page));
    const dotsWidth = doc.internal.pageSize.width - 40 - textWidth - pageNumWidth;
    const dotCount = Math.floor(dotsWidth / doc.getTextWidth("."));
    
    let dots = "";
    for (let i = 0; i < dotCount; i++) {
      dots += ".";
    }
    
    doc.text(dots, 20 + textWidth, yPos);
    
    // Add page number
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.text(String(page), doc.internal.pageSize.width - 20 - pageNumWidth, yPos);
    
    yPos += 8;
  };
  
  // Add fixed entries
  if (pageMap["summary"]) {
    addEntry("Property Summary", "summary");
  }
  addEntry("Disclaimer", "disclaimer");
  addEntry("Property Details", "details");
  
  // Add rooms entries
  if (report) {
    doc.setFont(pdfStyles.fonts.header, "bold");
    doc.text("Rooms", 18, yPos + 5);
    yPos += 12;
    
    report.rooms.forEach((room, index) => {
      addEntry(`${index + 1}. ${room.name}`, room.id);
    });
  }
  
  // Add final entry
  addEntry("Declaration", "final");
};
