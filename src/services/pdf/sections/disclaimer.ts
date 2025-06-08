
import { jsPDF } from "jspdf";
import { pdfStyles } from "../styles";

export function generateDisclaimerSection(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  const textWidth = pageWidth - (margins * 2); // Available width for text
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("DISCLAIMER", margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + 60, margins + 15);
  
  const disclaimers = [
    "This inventory report provides a record of the fixtures, fittings and contents of the property, and the property's condition at the start of the tenancy. All items are assumed to be in good condition and free from damage or defects unless otherwise stated.",
    "The inventory should be carefully checked by the tenant on arrival and any discrepancies or additional damages reported within 7 days. After this period, the inventory will be deemed accepted as accurate.",
    "The tenant is responsible for the return of all items listed in the same condition as at the start of tenancy, allowing for reasonable wear and tear. This inventory will be used as the basis for the check-out report at the end of tenancy.",
    "The inventory was conducted during daylight hours under normal lighting conditions. Items stored in lofts, cellars, locked rooms, or inaccessible locations are not included in this inventory. Testing of electrical appliances or heating systems is not undertaken as part of the inventory process."
  ];
  
  let yPosition = margins + 30;
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  // Add numbered disclaimer points with proper text wrapping
  disclaimers.forEach((disclaimer, index) => {
    const number = index + 1;
    const bulletText = `${number}. `;
    const bulletWidth = doc.getTextWidth(bulletText);
    
    // Calculate available width for text after bullet point
    const availableWidth = textWidth - bulletWidth;
    
    // Split text to properly wrap within available width
    const text = doc.splitTextToSize(disclaimer, availableWidth);
    
    // Check for page overflow
    if (yPosition + (text.length * 6) > doc.internal.pageSize.height - margins) {
      doc.addPage();
      yPosition = margins;
    }
    
    // Add bullet point
    doc.text(bulletText, margins, yPosition);
    
    // Add wrapped text after bullet point
    text.forEach((line: string, lineIndex: number) => {
      doc.text(line, margins + bulletWidth, yPosition + (lineIndex * 6));
    });
    
    // Move position for next item, accounting for number of wrapped lines
    yPosition += (text.length * 6) + 3;
  });
}
