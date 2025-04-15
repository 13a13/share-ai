
// PDF styling constants - using professional greyscale tones
export const pdfStyles = {
  colors: {
    primary: [50, 50, 50], // Dark grey
    secondary: [100, 100, 100], // Medium grey
    accent: [150, 150, 150], // Light grey
    white: [255, 255, 255],
    black: [0, 0, 0],
    gray: [128, 128, 128],
    lightGray: [220, 220, 220],
  },
  fonts: {
    header: "helvetica",
    body: "helvetica",
  },
  fontSizes: {
    title: 18,
    subtitle: 14,
    sectionTitle: 12,
    normal: 10,
    small: 8,
  },
  margins: {
    page: 20,
    section: 15,
  }
};

// Export Colors and Fonts for backward compatibility
export const Colors = {
  PRIMARY: pdfStyles.colors.primary,
  SECONDARY: pdfStyles.colors.secondary,
  ACCENT: pdfStyles.colors.accent,
  WHITE: pdfStyles.colors.white,
  BLACK: pdfStyles.colors.black,
  TEXT: pdfStyles.colors.primary,
  TEXT_DARK: [30, 30, 30],
  TEXT_LIGHT: [80, 80, 80],
  BORDER: [180, 180, 180],
  BORDER_LIGHT: [220, 220, 220],
};

export const Fonts = {
  HEADER_FONT: pdfStyles.fonts.header,
  BODY_FONT: pdfStyles.fonts.body,
};
