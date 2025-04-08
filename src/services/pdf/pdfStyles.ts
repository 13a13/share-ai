
// PDF styling utilities and constants

// PDF color constants
export const pdfColors = {
  primary: [67, 56, 202], // Indigo
  secondary: [99, 102, 241], // Lighter indigo
  accent: [139, 92, 246], // Purple
  white: [255, 255, 255],
  black: [45, 55, 72], // Slate-800
  gray: [113, 128, 150], // Slate-500
  lightGray: [226, 232, 240], // Slate-200
  bgGray: [247, 250, 252], // Slate-50
  successGreen: [72, 187, 120], // Green-500
  warningYellow: [237, 187, 22], // Yellow-500
  dangerRed: [245, 101, 101], // Red-500
};

// PDF font size constants
export const pdfFontSizes = {
  title: 24,
  subtitle: 18,
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

// Helper function to get color for condition badges
export function getConditionColor(condition: string): number[] {
  switch (condition.toLowerCase()) {
    case 'excellent':
      return [72, 187, 120]; // Green-500
    case 'good':
      return [56, 161, 105]; // Green-600
    case 'fair':
      return [237, 187, 22]; // Yellow-500
    case 'poor':
      return [237, 137, 54]; // Orange-500
    case 'damaged':
    case 'needs_replacement':
      return [245, 101, 101]; // Red-500
    default:
      return [113, 128, 150]; // Slate-500
  }
}

// Helper function to create consistent section styling
export function createSectionBox(doc: any, yPos: number, width: number, height: number, title: string): number {
  const titleHeight = 16;
  
  // Section background
  doc.setFillColor(pdfColors.bgGray[0], pdfColors.bgGray[1], pdfColors.bgGray[2]);
  doc.roundedRect(15, yPos, width, height, 3, 3, "F");
  
  // Section header background
  doc.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.roundedRect(15, yPos, width, titleHeight, 3, 3, "F");
  
  // Section title
  doc.setFontSize(pdfFontSizes.header);
  doc.setFont(pdfFonts.heading, "bold");
  doc.setTextColor(pdfColors.white[0], pdfColors.white[1], pdfColors.white[2]);
  doc.text(title, 25, yPos + 11);
  
  return yPos + titleHeight + 5; // Return the Y position after the title
}

