
// PDF styling utilities and constants

// PDF color palette that matches the dashboard
export const pdfColors = {
  primary: [14, 52, 96], // Ocean Blue (#0E345F - shareai-blue)
  secondary: [46, 139, 192], // Light Blue (#2E8BC0 - shareai-teal)
  accent: [255, 87, 34], // Orange Accent (#FF5722 - shareai-orange)
  white: [255, 255, 255], // Pure White (#FFFFFF)
  black: [34, 34, 34], // Dark Gray (#222222)
  gray: [138, 137, 140], // Medium Gray (#8A898C)
  lightGray: [241, 241, 241], // Light Gray (#F1F1F1)
  bgGray: [245, 247, 250], // Light Background (#F5F7FA - shareai-light)
  successGreen: [76, 175, 80],
  warningYellow: [255, 193, 7],
  dangerRed: [244, 67, 54],
};

// Font constants for use in PDF
export const defaultFont = "helvetica";
export const defaultFontBold = "helvetica";
export const primaryColor = "#0E345F";
export const secondaryColor = "#2E8BC0";

// Margin and size constants
export const defaultMargins = { left: 20, right: 20, top: 20, bottom: 20 };
export const contentWidth = 170; // A4 width (210mm) minus margins
export const roomImageHeight = 60; // Standard height for room images
export const componentImageHeight = 40; // Standard height for component images

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
export function getConditionColor(condition: string | undefined | null): number[] {
  // Handle undefined, null or non-string condition values
  if (!condition || typeof condition !== 'string') {
    return pdfColors.gray;
  }
  
  // Now safely call toLowerCase on the string
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

// Helper function to apply standard layout to a page
export function applyLayout(doc: any) {
  // Set default font and size
  doc.setFont(defaultFont);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Return starting Y position after header
  return { startY: defaultMargins.top + 10 };
}

// Helper function to create section styling - simplified
export function createSectionBox(doc: any, yPos: number, width: number, height: number, title: string): number {
  const titleHeight = 14;
  
  // Section background
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(pdfMargins.page, yPos, width, height, 3, 3, "F");
  
  // Section header background
  doc.setFillColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
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

// Helper function to draw dashed lines (since jsPDF might not support setLineDash)
export function drawDashedLine(doc: any, x1: number, y1: number, x2: number, y2: number, dashLength: number = 3, spaceLength: number = 3): void {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const numDashes = Math.floor(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (dashLength + spaceLength));
  const dashX = deltaX / (numDashes * 2);
  const dashY = deltaY / (numDashes * 2);

  doc.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  doc.setLineWidth(0.5);

  let currX = x1;
  let currY = y1;
  
  for (let i = 0; i < numDashes; i++) {
    const startX = currX;
    const startY = currY;
    currX += dashX;
    currY += dashY;
    doc.line(startX, startY, currX, currY); // Draw dash
    currX += dashX;
    currY += dashY;
    // Space is created by moving the current position without drawing
  }
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

// Helper to format dates consistently - accepts Date or string
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
