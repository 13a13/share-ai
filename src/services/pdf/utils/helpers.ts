
import { conditionRatingToText } from "../../imageProcessingService";
import { compressDataURLImage } from "@/utils/imageCompression";

/**
 * Helper function to derive cleanliness rating from general condition text
 */
export function getCleanlinessRating(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes("spotless") || lowerCondition.includes("excellent") || lowerCondition.includes("very clean")) {
    return "Excellent";
  } else if (lowerCondition.includes("good") || lowerCondition.includes("clean")) {
    return "Good";
  } else if (lowerCondition.includes("fair") || lowerCondition.includes("average")) {
    return "Fair";
  } else if (lowerCondition.includes("poor") || lowerCondition.includes("dirty")) {
    return "Poor";
  } else if (lowerCondition.includes("severe") || lowerCondition.includes("very dirty")) {
    return "Needs Full Cleaning";
  } else {
    return "Not specified";
  }
}

/**
 * Compresses and adds an image to the PDF document
 */
export async function addCompressedImage(
  doc: any, 
  imageUrl: string, 
  id: string, 
  xPos: number, 
  yPos: number, 
  width: number, 
  height: number,
  timestamp?: Date
): Promise<void> {
  try {
    // Compress image before adding to PDF
    const compressedImage = await compressDataURLImage(
      imageUrl,
      id,
      600, 
      600,
      0.7
    );
    
    doc.addImage(compressedImage, 'JPEG', xPos, yPos, width, height);
    
    // Add timestamp below image if available
    if (timestamp) {
      const { pdfStyles } = await import('../styles');
      doc.setFont(pdfStyles.fonts.body, "italic");
      doc.setFontSize(pdfStyles.fontSizes.small);
      const timestampStr = new Date(timestamp).toLocaleString();
      doc.text(timestampStr, xPos + width / 2, yPos + height + 5, { align: "center" });
    }
    
    return;
  } catch (error) {
    console.error(`Error adding image:`, error);
    throw error;
  }
}
