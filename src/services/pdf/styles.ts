
// PDF styles and constants

// Color definitions
export const Colors = {
  PRIMARY: [0, 100, 140], // Blue
  SECONDARY: [85, 170, 170], // Teal
  TEXT: [60, 60, 60], // Dark Gray
  TEXT_DARK: [40, 40, 40], // Darker Gray
  TEXT_LIGHT: [100, 100, 100], // Light Gray
  BORDER: [200, 200, 200], // Light Border
  BORDER_LIGHT: [220, 220, 220], // Very Light Border
  ERROR: [220, 50, 50], // Red
  SUCCESS: [50, 180, 50], // Green
  WARNING: [230, 150, 40], // Orange
  BACKGROUND: [250, 250, 250], // Off-White
  
  // Additional colors needed by section files
  black: [0, 0, 0],
  white: [255, 255, 255],
  gray: [128, 128, 128],
  lightGray: [200, 200, 200]
};

// Font definitions
export const Fonts = {
  HEADER_FONT: "helvetica",
  BODY_FONT: "helvetica",
};

// PDF styles
export const pdfStyles = {
  pageMargin: 14,
  smallMargin: 8,
  lineHeight: 5,
  headerFontSize: 14,
  subheaderFontSize: 12,
  bodyFontSize: 10,
  smallFontSize: 9,
  footerFontSize: 8,
  lineWidth: 0.5,
  thinLineWidth: 0.2,
  
  // Add the missing properties
  margins: {
    page: 14,
    small: 8
  },
  fonts: {
    header: "helvetica",
    body: "helvetica"
  },
  fontSizes: {
    title: 16,
    subtitle: 14,
    sectionTitle: 12,
    normal: 10,
    small: 9,
    footer: 8
  },
  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    gray: [128, 128, 128],
    lightGray: [200, 200, 200],
    primary: [0, 100, 140]
  }
};

// Extend PDF styles with additional settings for sections
export const extendedPdfStyles = {
  ...pdfStyles,
  // Any additional styles that might be needed
};
