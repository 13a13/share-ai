
// PDF styling utilities and constants

// PDF color palette that matches the dashboard
export const pdfColors = {
  primary: [155, 135, 245], // Primary Purple (#9b87f5)
  secondary: [126, 105, 171], // Secondary Purple (#7E69AB)
  accent: [30, 174, 219], // Bright Blue (#1EAEDB)
  white: [255, 255, 255],
  black: [34, 34, 34], // Dark Gray (#222222)
  gray: [138, 137, 140], // Medium Gray (#8A898C)
  lightGray: [241, 241, 241], // Light Gray (#F1F1F1)
  bgGray: [246, 246, 247], // Dark Gray (#F6F6F7)
  successGreen: [76, 175, 80],
  warningYellow: [255, 193, 7],
  dangerRed: [244, 67, 54],
};

// PDF font size constants - simplified for better readability
export const pdfFontSizes = {
  title: 16, // Large title (cover page, section headers)
  subtitle: 14, // Subtitles
  header: 12, // Component titles
  subheader: 11, // Section headers
  normal: 10, // Body text
  small: 8, // Captions, footnotes
};

// Font constants - using standard sans-serif fonts
export const pdfFonts = {
  heading: "helvetica",
  body: "helvetica",
};

// Margin constants - simplified
export const pdfMargins = {
  page: 20, // Standard page margin
  section: 10, // Section padding
  paragraph: 6, // Paragraph spacing
  component: 8, // Component padding
};

// Helper function to get color for condition badges
export function getConditionColor(condition: string): number[] {
  switch (condition.toLowerCase()) {
    case 'excellent':
      return pdfColors.successGreen;
    case 'good':
      return [76, 175, 80]; // Slightly lighter green
    case 'fair':
      return pdfColors.warningYellow;
    case 'poor':
      return [255, 152, 0]; // Orange
    case 'damaged':
    case 'needs_replacement':
      return pdfColors.dangerRed;
    default:
      return pdfColors.gray;
  }
}

// Helper function to create section styling - simplified
export function createSectionBox(doc: any, yPos: number, width: number, height: number, title: string): number {
  const titleHeight = 14;
  
  // Section background
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(pdfMargins.page, yPos, width, height, 3, 3, "F");
  
  // Section header background
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(pdfMargins.page, yPos, width, titleHeight, 3, 3, "F");
  
  // Section title
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(title, pdfMargins.page + 8, yPos + 10);
  
  return yPos + titleHeight + 4; // Return the Y position after the title
}

// Helper function to create elegant box - simplified
export function createElegantBox(doc: any, x: number, y: number, width: number, height: number, radius: number = 3): void {
  // Main box with clean background
  doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.roundedRect(x, y, width, height, radius, radius, "F");
  
  // Subtle border
  doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, height, radius, radius, "S");
}

// Helper function to create a horizontal separator
export function createSeparator(doc: any, y: number, width: number, startX: number = pdfMargins.page): number {
  doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.setLineWidth(0.5);
  doc.line(startX, y, startX + width, y);
  return y + pdfMargins.paragraph;
}

// Helper function for creating two-column layout
export function createTwoColumnLayout(doc: any, leftContent: string, rightContent: string, yPos: number, labelLeft: string, labelRight: string): number {
  const pageWidth = doc.internal.pageSize.width;
  const colWidth = (pageWidth - (pdfMargins.page * 2)) / 2 - 5;
  
  // Labels in bold
  doc.setFont(pdfFonts.body, "bold");
  doc.setTextColor(pdfColors.black[0], pdfColors.black[1], pdfColors.black[2]);
  doc.text(labelLeft, pdfMargins.page, yPos);
  doc.text(labelRight, pdfMargins.page + colWidth + 10, yPos);
  
  // Content in normal font
  doc.setFont(pdfFonts.body, "normal");
  
  // Handle multiline text
  const splitLeft = doc.splitTextToSize(leftContent, colWidth);
  const splitRight = doc.splitTextToSize(rightContent, colWidth);
  
  doc.text(splitLeft, pdfMargins.page, yPos + 7);
  doc.text(splitRight, pdfMargins.page + colWidth + 10, yPos + 7);
  
  // Return the new Y position
  const leftHeight = splitLeft.length * 7;
  const rightHeight = splitRight.length * 7;
  return yPos + Math.max(leftHeight, rightHeight) + pdfMargins.paragraph;
}

// Helper to format dates consistently - now accepts Date or string
export function formatDate(dateInput: string | Date): string {
  if (!dateInput) return "Not specified";
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return typeof dateInput === 'string' ? dateInput : "Invalid date";
  }
}

// Helper to capitalize words for consistent formatting
export function capitalizeWords(text: string): string {
  return text
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
