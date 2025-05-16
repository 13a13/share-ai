
import { conditionRatingToText } from "../../imageProcessingService";

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
 * Check if content would overflow into footer area
 * Returns true if a new page is needed
 */
export function checkPageOverflow(doc: any, yPosition: number, contentHeight: number): boolean {
  const pageHeight = doc.internal.pageSize.height;
  const footerMargin = 25; // 25mm from bottom of page reserved for footer
  
  return (yPosition + contentHeight) > (pageHeight - footerMargin);
}
