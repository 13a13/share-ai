
// PDF styling utilities and constants

// PDF color constants
export const pdfColors = {
  primary: [0, 123, 255], // Blue
  accent: [40, 167, 169], // Teal (shareai-teal)
  white: [255, 255, 255],
  black: [0, 0, 0],
  gray: [100, 100, 100],
  lightGray: [240, 240, 240],
  bgGray: [245, 245, 245],
};

// PDF font size constants
export const pdfFontSizes = {
  title: 18,
  subtitle: 14,
  header: 12,
  normal: 10,
  small: 8,
};

// Helper function to get color for condition badges
export function getConditionColor(condition: string): number[] {
  switch (condition.toLowerCase()) {
    case 'excellent':
      return [46, 204, 113]; // Green
    case 'good':
      return [39, 174, 96]; // Dark green
    case 'fair':
      return [241, 196, 15]; // Yellow
    case 'poor':
      return [230, 126, 34]; // Orange
    case 'damaged':
      return [231, 76, 60]; // Red
    default:
      return [149, 165, 166]; // Gray
  }
}
