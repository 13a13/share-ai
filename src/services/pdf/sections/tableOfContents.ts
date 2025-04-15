
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { Colors, Fonts } from "../styles";

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
  doc.setFont(Fonts.HEADER_FONT, "bold");
  doc.setFontSize(16);
  doc.setTextColor(Colors.PRIMARY[0], Colors.PRIMARY[1], Colors.PRIMARY[2]);
  doc.text("Contents", 14, 30);
  
  // Set up for table of contents entries
  doc.setFont(Fonts.BODY_FONT, "normal");
  doc.setFontSize(11);
  doc.setTextColor(Colors.TEXT[0], Colors.TEXT[1], Colors.TEXT[2]);
  
  // Start position for entries
  let yPos = 45;
  
  // Function to add a table of contents entry
  const addEntry = (text: string, pageKey: string): void => {
    const page = pageMap[pageKey];
    if (!page) return;
    
    doc.setFont(Fonts.BODY_FONT, "normal");
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
    doc.setFont(Fonts.BODY_FONT, "bold");
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
    doc.setFont(Fonts.HEADER_FONT, "bold");
    doc.text("Rooms", 18, yPos + 5);
    yPos += 12;
    
    report.rooms.forEach((room, index) => {
      addEntry(`${index + 1}. ${room.name}`, room.id);
    });
  }
  
  // Add final entry
  addEntry("Declaration", "final");
};
