
// PDF styling utilities and constants

// PDF color constants - softer, more elegant palette with reduced contrast
export const pdfColors = {
  primary: [59, 130, 246], // Softer blue
  secondary: [96, 165, 250], // Lighter blue
  accent: [167, 139, 250], // Soft purple
  white: [255, 255, 255],
  black: [71, 85, 105], // Softer slate-700
  gray: [148, 163, 184], // Softer slate-400
  lightGray: [241, 245, 249], // Softer slate-100
  bgGray: [249, 250, 251], // Softer slate-50
  successGreen: [132, 204, 170], // Softer green
  warningYellow: [251, 211, 141], // Softer yellow
  dangerRed: [248, 153, 153], // Softer red
};

// PDF font size constants - slightly adjusted for better readability
export const pdfFontSizes = {
  title: 22,
  subtitle: 16,
  header: 14,
  subheader: 12,
  normal: 10,
  small: 8,
};

// Font constants
export const pdfFonts = {
  heading: "helvetica",
  body: "helvetica",
};

// Helper function to get color for condition badges - softer colors
export function getConditionColor(condition: string): number[] {
  switch (condition.toLowerCase()) {
    case 'excellent':
      return [132, 204, 170]; // Softer green
    case 'good':
      return [163, 217, 190]; // Even softer green
    case 'fair':
      return [251, 211, 141]; // Softer yellow
    case 'poor':
      return [251, 175, 130]; // Softer orange
    case 'damaged':
    case 'needs_replacement':
      return [248, 153, 153]; // Softer red
    default:
      return [148, 163, 184]; // Softer slate-400
  }
}

// Helper function to create consistent section styling with softer colors
export function createSectionBox(doc: any, yPos: number, width: number, height: number, title: string): number {
  const titleHeight = 16;
  
  // Section background - softer
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(15, yPos, width, height, 4, 4, "F");
  
  // Section header background - softer gradient effect
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(15, yPos, width, titleHeight, 4, 4, "F");
  
  // Section title
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(title, 25, yPos + 11);
  
  return yPos + titleHeight + 5; // Return the Y position after the title
}

// Helper function to create elegant box shadows (simulation)
export function createElegantBox(doc: any, x: number, y: number, width: number, height: number, radius: number = 4): void {
  // Main box with softer background
  doc.setFillColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.roundedRect(x, y, width, height, radius, radius, "F");
  
  // Subtle border
  doc.setDrawColor(230, 235, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, height, radius, radius, "S");
}
