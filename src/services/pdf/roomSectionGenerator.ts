import { jsPDF } from "jspdf";
import { Room, RoomComponent } from "@/types";
import { conditionRatingToText } from "../imageProcessingService";
import { 
  pdfColors, pdfFontSizes, pdfFonts, pdfMargins,
  defaultFont, defaultFontBold, secondaryColor, primaryColor,
  defaultMargins, contentWidth, roomImageHeight,
  componentImageHeight, applyLayout
} from "./pdfStyles";

// Generate a PDF section for a room inspection
export function generateRoomSection(
  doc: jsPDF, 
  room: Room, 
  addHeaderAndFooter: () => void
) {
  // Apply header and base styling
  const { startY } = applyLayout(doc);
  
  // Room heading
  doc.setFont(defaultFontBold);
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text(room.name, defaultMargins.left, startY);
  
  let currentY = startY + 8;
  
  // Room type
  doc.setFont(defaultFont);
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  doc.text(
    `Type: ${room.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 
    defaultMargins.left, 
    currentY
  );
  currentY += 5;
  
  // Room general condition
  if (room.generalCondition) {
    currentY += 8;
    doc.setFont(defaultFontBold);
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text("General Condition", defaultMargins.left, currentY);
    currentY += 6;
    
    doc.setFont(defaultFont);
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    
    const generalConditionText = doc.splitTextToSize(
      room.generalCondition, 
      contentWidth
    );
    
    doc.text(generalConditionText, defaultMargins.left, currentY);
    currentY += (generalConditionText.length * 5) + 8;
  }
  
  // Room images
  if (room.images && room.images.length > 0) {
    doc.setFont(defaultFontBold);
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text("Room Images", defaultMargins.left, currentY);
    currentY += 8;
    
    // Calculate grid layout based on image count
    const imageCount = Math.min(room.images.length, 4); // Show max 4 images
    const imagesPerRow = imageCount > 2 ? 2 : imageCount;
    const imageWidth = contentWidth / imagesPerRow;
    
    // Add images in a grid
    for (let i = 0; i < imageCount; i++) {
      const image = room.images[i];
      
      // Calculate position in grid
      const col = i % imagesPerRow;
      const row = Math.floor(i / imagesPerRow);
      
      const imgX = defaultMargins.left + (col * imageWidth);
      const imgY = currentY + (row * (roomImageHeight + 5));
      
      try {
        doc.addImage(
          image.url, 
          'JPEG', 
          imgX, 
          imgY, 
          imageWidth - 5, 
          roomImageHeight
        );
      } catch (error) {
        console.error("Error adding image to PDF", error);
        // Add placeholder for failed image
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(240, 240, 240);
        doc.rect(
          imgX, 
          imgY, 
          imageWidth - 5, 
          roomImageHeight, 
          'FD'
        );
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(
          'Image unavailable', 
          imgX + ((imageWidth - 5) / 2), 
          imgY + (roomImageHeight / 2), 
          { align: 'center' }
        );
      }
    }
    
    // Update Y position past the images
    const rowsNeeded = Math.ceil(imageCount / imagesPerRow);
    currentY += (rowsNeeded * (roomImageHeight + 5)) + 5;
  }
  
  // Components
  if (room.components && room.components.length > 0) {
    doc.setFont(defaultFontBold);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text("Components", defaultMargins.left, currentY);
    currentY += 8;
    
    // Sort components to put custom components after standard ones
    const sortedComponents = [...room.components].sort((a, b) => {
      // Put custom components after standard ones
      if (a.isCustom && !b.isCustom) return 1;
      if (!a.isCustom && b.isCustom) return -1;
      // Otherwise sort by name
      return a.name.localeCompare(b.name);
    });
    
    // Process each component
    for (const component of sortedComponents) {
      // Check if we need a new page
      if (currentY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        addHeaderAndFooter();
        currentY = startY;
      }
      
      // Add the component
      currentY = addComponentToReport(doc, component, currentY);
      
      // Add some spacing between components
      currentY += 10;
    }
  }
}

// Add a component to the PDF report
function addComponentToReport(
  doc: jsPDF, 
  component: RoomComponent, 
  startY: number
): number {
  let currentY = startY;
  
  // Component heading with name and condition
  doc.setFont(defaultFontBold);
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  
  // Show a special icon or prefix for custom components
  const customPrefix = component.isCustom ? "🔹 " : "";
  const componentName = `${customPrefix}${component.name}`;
  
  doc.text(componentName, defaultMargins.left, currentY);
  
  // Condition badge
  if (component.condition) {
    const conditionText = conditionRatingToText(component.condition);
    
    // Measure text width to place badge correctly
    const textWidth = doc.getTextWidth(componentName);
    const badgeX = defaultMargins.left + textWidth + 5;
    
    // Draw condition badge
    drawConditionBadge(doc, component.condition, badgeX, currentY - 3);
  }
  
  currentY += 5;
  
  // Description
  if (component.description) {
    currentY += 5;
    doc.setFont(defaultFont);
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    
    const descriptionText = doc.splitTextToSize(
      component.description, 
      contentWidth
    );
    
    doc.text(descriptionText, defaultMargins.left, currentY);
    currentY += (descriptionText.length * 5) + 3;
  }
  
  // Condition summary
  if (component.conditionSummary) {
    currentY += 3;
    doc.setFont(defaultFontBold);
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text("Condition:", defaultMargins.left, currentY);
    currentY += 5;
    
    doc.setFont(defaultFont);
    const conditionText = doc.splitTextToSize(
      component.conditionSummary, 
      contentWidth - 10
    );
    
    doc.text(conditionText, defaultMargins.left + 5, currentY);
    currentY += (conditionText.length * 5) + 3;
  }
  
  // Condition points (bullet points)
  if (component.conditionPoints && component.conditionPoints.length > 0) {
    doc.setFont(defaultFont);
    doc.setFontSize(10);
    
    for (const point of component.conditionPoints) {
      if (point.trim()) {
        currentY += 5;
        const bulletText = `• ${point}`;
        const wrappedText = doc.splitTextToSize(
          bulletText, 
          contentWidth - 10
        );
        
        doc.text(wrappedText, defaultMargins.left + 5, currentY);
        currentY += (wrappedText.length * 5);
      }
    }
    
    currentY += 3;
  }
  
  // Notes
  if (component.notes) {
    currentY += 3;
    doc.setFont(defaultFontBold);
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text("Notes:", defaultMargins.left, currentY);
    currentY += 5;
    
    doc.setFont(defaultFont);
    const notesText = doc.splitTextToSize(
      component.notes, 
      contentWidth - 10
    );
    
    doc.text(notesText, defaultMargins.left + 5, currentY);
    currentY += (notesText.length * 5) + 3;
  }
  
  // Component images
  if (component.images && component.images.length > 0) {
    currentY += 3;
    
    // Calculate grid layout based on image count
    const imageCount = Math.min(component.images.length, 3); // Show max 3 images per component
    const imagesPerRow = imageCount;
    const imageWidth = contentWidth / imagesPerRow;
    
    // Add images in a grid
    for (let i = 0; i < imageCount; i++) {
      const image = component.images[i];
      
      // Calculate position in grid
      const col = i % imagesPerRow;
      
      const imgX = defaultMargins.left + (col * imageWidth);
      const imgY = currentY;
      
      try {
        doc.addImage(
          image.url, 
          'JPEG', 
          imgX, 
          imgY, 
          imageWidth - 5, 
          componentImageHeight
        );
      } catch (error) {
        console.error("Error adding component image to PDF", error);
        // Add placeholder for failed image
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(240, 240, 240);
        doc.rect(
          imgX, 
          imgY, 
          imageWidth - 5, 
          componentImageHeight, 
          'FD'
        );
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(
          'Image unavailable', 
          imgX + ((imageWidth - 5) / 2), 
          imgY + (componentImageHeight / 2), 
          { align: 'center' }
        );
      }
    }
    
    // Update Y position past the images
    currentY += componentImageHeight + 5;
  }
  
  return currentY;
}

// Draw a condition badge on the PDF
function drawConditionBadge(
  doc: jsPDF, 
  condition: string, 
  x: number, 
  y: number
) {
  let badgeColor;
  let textColor = '#ffffff';
  
  // Set badge color based on condition
  switch (condition) {
    case 'excellent':
      badgeColor = '#10b981'; // green
      break;
    case 'good':
      badgeColor = '#3b82f6'; // blue
      break;
    case 'fair':
      badgeColor = '#f59e0b'; // amber
      break;
    case 'poor':
      badgeColor = '#ef4444'; // red
      break;
    case 'needs_replacement':
      badgeColor = '#7f1d1d'; // dark red
      break;
    default:
      badgeColor = '#6b7280'; // gray
  }
  
  const conditionText = conditionRatingToText(condition);
  
  // Measure badge width
  doc.setFont(defaultFont);
  doc.setFontSize(8);
  const textWidth = doc.getTextWidth(conditionText);
  const badgeWidth = textWidth + 10;
  const badgeHeight = 5;
  
  // Draw badge background
  doc.setFillColor(badgeColor);
  doc.roundedRect(x, y - 4, badgeWidth, badgeHeight + 4, 1, 1, 'F');
  
  // Draw text
  doc.setTextColor(textColor);
  doc.text(conditionText, x + 5, y);
}
