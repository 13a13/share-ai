
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { pdfStyles } from "../styles";

/**
 * Generate the comparison section of the PDF
 */
export function generateComparisonSection(doc: jsPDF, report: Report): void {
  if (!report.reportInfo?.comparisonText) return;
  
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  let yPosition = margins + 10;
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("PROPERTY COMPARISON", margins, yPosition);
  yPosition += 15;
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, yPosition, margins + 100, yPosition);
  yPosition += 20;
  
  // Parse markdown-like content and format it
  const lines = report.reportInfo.comparisonText.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      yPosition += 5;
      continue;
    }
    
    // Check if we need to add a new page
    if (yPosition > doc.internal.pageSize.height - margins - 20) {
      doc.addPage();
      yPosition = margins + 10;
    }
    
    // Handle markdown-like headers
    if (trimmedLine.startsWith('###')) {
      // Subheading
      doc.setFont(pdfStyles.fonts.header, "bold");
      doc.setFontSize(pdfStyles.fontSizes.subtitle);
      const text = trimmedLine.replace(/^###\s+/, '');
      doc.text(text, margins, yPosition);
      yPosition += 10;
    } else if (trimmedLine.startsWith('##')) {
      // Heading
      doc.setFont(pdfStyles.fonts.header, "bold");
      doc.setFontSize(pdfStyles.fontSizes.sectionTitle + 2);
      const text = trimmedLine.replace(/^##\s+/, '');
      doc.text(text, margins, yPosition);
      yPosition += 10;
    } else if (trimmedLine.startsWith('####')) {
      // Smaller subheading
      doc.setFont(pdfStyles.fonts.header, "bold");
      doc.setFontSize(pdfStyles.fontSizes.normal + 2);
      const text = trimmedLine.replace(/^####\s+/, '');
      doc.text(text, margins, yPosition);
      yPosition += 8;
    } else if (trimmedLine.startsWith('-')) {
      // List item
      doc.setFont(pdfStyles.fonts.body, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      const text = trimmedLine;
      
      // Handle bold text within list items
      const boldPattern = /\*\*(.*?)\*\*/g;
      let match;
      let lastIndex = 0;
      let xPosition = margins + 5; // Indent list items
      
      // If no bold pattern, just render the text normally
      if (!boldPattern.test(text)) {
        const bulletText = text.replace(/^-\s+/, '• ');
        const splitText = doc.splitTextToSize(bulletText, pageWidth - margins * 2 - 10);
        doc.text(splitText, xPosition, yPosition);
        yPosition += splitText.length * 6;
      } else {
        // Reset regex lastIndex
        boldPattern.lastIndex = 0;
        
        // Split the list item text for bold formatting
        const plainText = text.replace(/^-\s+/, '• ');
        
        while ((match = boldPattern.exec(plainText)) !== null) {
          // Text before bold part
          const beforeText = plainText.substring(lastIndex, match.index);
          if (beforeText) {
            doc.setFont(pdfStyles.fonts.body, "normal");
            doc.text(beforeText, xPosition, yPosition);
            xPosition += doc.getTextWidth(beforeText);
          }
          
          // Bold part
          const boldText = match[1];
          doc.setFont(pdfStyles.fonts.body, "bold");
          doc.text(boldText, xPosition, yPosition);
          xPosition += doc.getTextWidth(boldText);
          
          lastIndex = match.index + match[0].length;
        }
        
        // Remaining text after last bold part
        if (lastIndex < plainText.length) {
          doc.setFont(pdfStyles.fonts.body, "normal");
          doc.text(plainText.substring(lastIndex), xPosition, yPosition);
        }
        
        yPosition += 6;
      }
    } else {
      // Regular paragraph
      doc.setFont(pdfStyles.fonts.body, "normal");
      doc.setFontSize(pdfStyles.fontSizes.normal);
      const splitText = doc.splitTextToSize(trimmedLine, pageWidth - margins * 2);
      doc.text(splitText, margins, yPosition);
      yPosition += splitText.length * 6;
    }
    
    // Add some spacing after each line
    yPosition += 2;
  }
}
