
// PDF styling utilities and constants

// PDF color constants - professional color palette
export const pdfColors = {
  primary: [26, 35, 126], // Deep Blue (#1A237E)
  secondary: [0, 121, 107], // Teal (#00796B)
  accent: [245, 245, 245], // Light Gray (#F5F5F5)
  white: [255, 255, 255],
  black: [33, 33, 33], // Near black for main text
  gray: [117, 117, 117], // Medium gray for secondary text
  lightGray: [224, 224, 224], // Lighter gray for borders
  bgGray: [245, 245, 245], // Light gray for backgrounds
  successGreen: [76, 175, 80], // Professional green
  warningYellow: [255, 193, 7], // Professional amber
  dangerRed: [244, 67, 54], // Professional red
};

// PDF font size constants - improved readability
export const pdfFontSizes = {
  title: 18, // Large title (cover page, section headers)
  subtitle: 16, // Subtitles
  header: 14, // Component titles
  subheader: 12, // Section headers
  normal: 11, // Body text
  small: 9, // Captions, footnotes
};

// Font constants - using standard sans-serif fonts
export const pdfFonts = {
  heading: "helvetica",
  body: "helvetica",
};

// Margin constants
export const pdfMargins = {
  page: 25, // ~1 inch margin
  section: 12, // Section padding
  paragraph: 8, // Paragraph spacing
  component: 10, // Component padding
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

// Helper function to create elegant section styling
export function createSectionBox(doc: any, yPos: number, width: number, height: number, title: string): number {
  const titleHeight = 16;
  
  // Section background
  doc.setFillColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
  doc.roundedRect(pdfMargins.page, yPos, width, height, 4, 4, "F");
  
  // Section header background
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(pdfMargins.page, yPos, width, titleHeight, 4, 4, "F");
  
  // Section title
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(title, pdfMargins.page + 10, yPos + 11);
  
  return yPos + titleHeight + 5; // Return the Y position after the title
}

// Helper function to create elegant box
export function createElegantBox(doc: any, x: number, y: number, width: number, height: number, radius: number = 4): void {
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

// Helper to format dates consistently
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
    return String(dateInput);
  }
}

// Helper to capitalize words for consistent formatting
export function capitalizeWords(text: string): string {
  return text
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// Custom dashed line function for jsPDF v3
export function drawDashedLine(
  doc: any, 
  xStart: number, 
  yStart: number, 
  xEnd: number, 
  yEnd: number, 
  dashLength: number = 2, 
  spaceLength: number = 2
): void {
  // Calculate line length and angle
  const lineLength = Math.sqrt(Math.pow(xEnd - xStart, 2) + Math.pow(yEnd - yStart, 2));
  const angle = Math.atan2(yEnd - yStart, xEnd - xStart);
  
  // Calculate number of segments
  const segmentLength = dashLength + spaceLength;
  const segments = Math.floor(lineLength / segmentLength);
  
  // Draw dash segments
  for (let i = 0; i < segments; i++) {
    const startSegmentDistance = i * segmentLength;
    const startX = xStart + Math.cos(angle) * startSegmentDistance;
    const startY = yStart + Math.sin(angle) * startSegmentDistance;
    
    const endSegmentDistance = startSegmentDistance + dashLength;
    const endX = xStart + Math.cos(angle) * endSegmentDistance;
    const endY = yStart + Math.sin(angle) * endSegmentDistance;
    
    doc.line(startX, startY, endX, endY);
  }
  
  // Draw the last segment if needed
  const remainingLength = lineLength - (segments * segmentLength);
  if (remainingLength > 0 && remainingLength <= dashLength) {
    const startX = xStart + Math.cos(angle) * (segments * segmentLength);
    const startY = yStart + Math.sin(angle) * (segments * segmentLength);
    
    const endX = startX + Math.cos(angle) * remainingLength;
    const endY = startY + Math.sin(angle) * remainingLength;
    
    doc.line(startX, startY, endX, endY);
  }
}
