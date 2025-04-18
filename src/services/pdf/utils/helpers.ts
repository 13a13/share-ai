
import { conditionRatingToText } from "../../imageProcessingService";
import { compressDataURLImage } from "@/utils/imageCompression";
import { pdfStyles } from "../styles";

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
  timestamp?: Date,
  maintainAspectRatio: boolean = true
): Promise<void> {
  try {
    // Check if we have a valid image URL before proceeding
    if (!imageUrl || imageUrl.trim() === '') {
      console.error(`Invalid image URL for ${id}`);
      drawPlaceholder(doc, xPos, yPos, width, height);
      return;
    }

    // Check if adding the image would overflow into footer area
    // Get the footer start position (usually around 15mm from bottom)
    const pageHeight = doc.internal.pageSize.height;
    const footerMargin = 25; // Keep 25mm from bottom of page clear for footer
    
    // If image would extend into footer, add a new page
    if (yPos + height > pageHeight - footerMargin) {
      doc.addPage();
      yPos = 20; // Reset Y position at top of new page with some margin
    }

    // Handle different image formats
    const imageFormat = getImageFormat(imageUrl);
    
    // Attempt to compress the image before adding to PDF
    try {
      const compressedImage = await compressDataURLImage(
        imageUrl,
        id,
        800, // Increased max dimension
        800,
        0.75 // Slightly higher quality
      );
      
      // If maintaining aspect ratio is enabled, calculate dimensions that preserve the original ratio
      if (maintainAspectRatio) {
        // Create a temporary image element to get the natural dimensions
        const tempImg = new Image();
        tempImg.src = compressedImage;
        
        // Calculate aspect ratio
        await new Promise<void>((resolve) => {
          tempImg.onload = () => {
            const aspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
            
            if (aspectRatio > 1) {
              // Landscape image
              const newHeight = width / aspectRatio;
              // Add the image with the calculated height that maintains aspect ratio
              doc.addImage(compressedImage, imageFormat, xPos, yPos, width, newHeight);
              // Adjust timestamp position
              if (timestamp) {
                doc.setFont(pdfStyles.fonts.body, "italic");
                doc.setFontSize(pdfStyles.fontSizes.small);
                const timestampStr = new Date(timestamp).toLocaleString();
                doc.text(timestampStr, xPos + width / 2, yPos + newHeight + 5, { align: "center" });
              }
            } else {
              // Portrait image
              const newWidth = height * aspectRatio;
              // Add the image with the calculated width that maintains aspect ratio
              doc.addImage(compressedImage, imageFormat, xPos, yPos, newWidth, height);
              // Adjust timestamp position
              if (timestamp) {
                doc.setFont(pdfStyles.fonts.body, "italic");
                doc.setFontSize(pdfStyles.fontSizes.small);
                const timestampStr = new Date(timestamp).toLocaleString();
                doc.text(timestampStr, xPos + newWidth / 2, yPos + height + 5, { align: "center" });
              }
            }
            resolve();
          };
          tempImg.onerror = () => {
            // If we can't load the image to determine aspect ratio, use original dimensions
            doc.addImage(compressedImage, imageFormat, xPos, yPos, width, height);
            resolve();
          };
        });
      } else {
        // Add the compressed image to the document with the specified dimensions
        doc.addImage(compressedImage, imageFormat, xPos, yPos, width, height);
        
        // Add timestamp below image if available
        if (timestamp) {
          doc.setFont(pdfStyles.fonts.body, "italic");
          doc.setFontSize(pdfStyles.fontSizes.small);
          const timestampStr = new Date(timestamp).toLocaleString();
          doc.text(timestampStr, xPos + width / 2, yPos + height + 5, { align: "center" });
        }
      }
    } catch (compressionError) {
      console.error(`Compression error for image ${id}:`, compressionError);
      
      // Fall back to using the original image if compression fails
      try {
        doc.addImage(imageUrl, imageFormat, xPos, yPos, width, height);
      } catch (addImageError) {
        console.error(`Could not add image ${id} to PDF:`, addImageError);
        drawPlaceholder(doc, xPos, yPos, width, height);
      }
    }
    
    return;
  } catch (error) {
    console.error(`Error adding image ${id}:`, error);
    drawPlaceholder(doc, xPos, yPos, width, height);
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

/**
 * Draw a placeholder where an image would be
 */
function drawPlaceholder(doc: any, xPos: number, yPos: number, width: number, height: number): void {
  // Get colors from the imported pdfStyles
  const { colors } = pdfStyles;
  
  // Draw a rectangle with border
  doc.setDrawColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.rect(xPos, yPos, width, height, 'FD'); // Fill and draw
  
  // Add placeholder text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
  doc.text("Image not available", xPos + width / 2, yPos + height / 2, { align: "center" });
}

/**
 * Determine image format from URL or data URL
 */
function getImageFormat(imageUrl: string): string {
  // For data URLs, extract the MIME type
  if (imageUrl.startsWith('data:')) {
    const mimeMatch = imageUrl.match(/data:(image\/[^;]+);/);
    if (mimeMatch && mimeMatch[1]) {
      const mimeType = mimeMatch[1].toLowerCase();
      
      // Map common MIME types to jsPDF format strings
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'JPEG';
      if (mimeType === 'image/png') return 'PNG';
      if (mimeType === 'image/webp') return 'WEBP';
      
      // Default to JPEG for other types
      return 'JPEG';
    }
  }
  
  // For regular URLs, check the file extension
  const extension = imageUrl.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'PNG';
  if (extension === 'webp') return 'WEBP';
  
  // Default to JPEG
  return 'JPEG';
}
