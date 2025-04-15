
import { jsPDF } from "jspdf";
import { Report, Property, Room, RoomComponent } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { conditionRatingToText } from "../imageProcessingService";
import { compressDataURLImage } from "@/utils/imageCompression";

export type PDFGenerationStatus = "idle" | "generating" | "complete" | "error";

// PDF styling constants - using professional greyscale tones
const pdfStyles = {
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

/**
 * Hook for generating PDF reports in Green Kite style
 */
export const usePDFGeneration = () => {
  const { toast } = useToast();
  
  /**
   * Generate a PDF for a property report
   * @param report The report data
   * @param property The property data
   * @returns Promise with the download URL
   */
  const generatePDF = async (
    report: Report, 
    property: Property
  ): Promise<string> => {
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Define document dimensions for convenience
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Set up document metadata
      doc.setProperties({
        title: `Inventory Report - ${property.address}`,
        subject: `Inventory and Check In Report for ${property.address}`,
        author: report.reportInfo?.clerk || "Share.AI",
        creator: "Share.AI Property Reports"
      });
      
      // Generate sections
      await generateCoverPage(doc, report, property);
      doc.addPage();
      
      // Track page numbers for table of contents
      const pageMap: Record<string, number> = {};
      let currentPage = 2; // Cover is page 1
      
      // Add table of contents (contents page) as page 2
      pageMap["contents"] = currentPage++;
      generateTableOfContents(doc, pageMap);
      doc.addPage();
      
      // Add disclaimer section as page 3
      pageMap["disclaimer"] = currentPage++;
      generateDisclaimerSection(doc);
      doc.addPage();
      
      // Add summaries as page 4
      pageMap["summary"] = currentPage++;
      generateSummaryTables(doc, report, property);
      doc.addPage();
      
      // Track start of rooms for table of contents
      for (let i = 0; i < report.rooms.length; i++) {
        const room = report.rooms[i];
        // Record page number for this room
        pageMap[room.id] = currentPage++;
        
        // Generate room section
        await generateRoomSection(doc, room, i + 1);
        
        // Add new page for next room (except for last room)
        if (i < report.rooms.length - 1) {
          doc.addPage();
        }
      }
      
      // Add final sections
      doc.addPage();
      pageMap["final"] = currentPage++;
      generateFinalSections(doc, report, property);
      
      // Go back and update table of contents with correct page numbers
      doc.setPage(1);
      doc.addPage();
      generateTableOfContents(doc, pageMap, report);
      
      // Add headers and footers to all pages
      addHeadersAndFooters(doc, property.address);
      
      // Convert the PDF to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      // Show success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your inventory report is ready to download.",
        variant: "default",
      });
      
      return pdfBase64;
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Show error toast
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  return {
    generatePDF,
  };
};

/**
 * Generate the cover page
 */
async function generateCoverPage(doc: jsPDF, report: Report, property: Property): Promise<void> {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Title - INVENTORY & CHECK IN
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title + 6);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("INVENTORY & CHECK IN", pageWidth / 2, 60, { align: "center" });
  
  // Property Address - centered and prominent
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text(property.address, pageWidth / 2, 80, { align: "center" });
  doc.text(`${property.city}, ${property.state} ${property.zipCode}`, pageWidth / 2, 90, { align: "center" });
  
  // Date and Report Details
  const reportDate = report.reportInfo?.reportDate 
    ? new Date(report.reportInfo.reportDate).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : "Not specified";
  
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  doc.text(`Date: ${reportDate}`, pageWidth / 2, 110, { align: "center" });
  
  if (report.reportInfo?.clerk) {
    doc.text(`Clerk: ${report.reportInfo.clerk}`, pageWidth / 2, 120, { align: "center" });
  }
  
  // Logo placeholder - box for logo
  doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth / 2 - 30, 140, 60, 30);
  doc.setFontSize(pdfStyles.fontSizes.small);
  doc.text("Logo", pageWidth / 2, 155, { align: "center" });
  
  // Footer at bottom of page
  doc.setFont(pdfStyles.fonts.body, "italic");
  doc.setFontSize(pdfStyles.fontSizes.small);
  doc.text(
    "This inventory report was created using Share.AI Property Reports", 
    pageWidth / 2, 
    pageHeight - 20, 
    { align: "center" }
  );
}

/**
 * Generate table of contents with dot leaders
 */
function generateTableOfContents(doc: jsPDF, pageMap: Record<string, number>, report?: Report): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("CONTENTS", margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + 40, margins + 15);
  
  let yPosition = margins + 30;
  
  // Standard sections
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  const standardSections = [
    { key: "disclaimer", label: "Disclaimer" },
    { key: "summary", label: "Summary" },
  ];
  
  for (const section of standardSections) {
    const pageNumber = pageMap[section.key] || "";
    const textWidth = doc.getTextWidth(section.label);
    const dotsWidth = pageWidth - margins * 2 - textWidth - 5;
    
    // Draw section name
    doc.text(section.label, margins, yPosition);
    
    // Calculate dot leaders
    const dotCount = Math.floor(dotsWidth / 2);
    let dots = "";
    for (let i = 0; i < dotCount; i++) {
      dots += ". ";
    }
    
    // Draw dot leaders and page number
    doc.text(dots, margins + textWidth + 3, yPosition);
    doc.text(pageNumber.toString(), pageWidth - margins, yPosition, { align: "right" });
    
    yPosition += 10;
  }
  
  // Rooms (if report provided)
  if (report && report.rooms.length > 0) {
    yPosition += 10;
    doc.setFont(pdfStyles.fonts.header, "bold");
    doc.text("Rooms", margins, yPosition);
    yPosition += 10;
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    
    report.rooms.forEach((room, index) => {
      const roomNum = index + 1;
      const roomLabel = `${roomNum}. ${room.name}`;
      const textWidth = doc.getTextWidth(roomLabel);
      const dotsWidth = pageWidth - margins * 2 - textWidth - 5;
      const pageNumber = pageMap[room.id] || "";
      
      // Draw room name
      doc.text(roomLabel, margins, yPosition);
      
      // Calculate dot leaders
      const dotCount = Math.floor(dotsWidth / 2);
      let dots = "";
      for (let i = 0; i < dotCount; i++) {
        dots += ". ";
      }
      
      // Draw dot leaders and page number
      doc.text(dots, margins + textWidth + 3, yPosition);
      doc.text(pageNumber.toString(), pageWidth - margins, yPosition, { align: "right" });
      
      yPosition += 10;
    });
  }
  
  // Final sections
  yPosition += 10;
  const finalSectionLabel = "Final Notes & Declarations";
  const textWidth = doc.getTextWidth(finalSectionLabel);
  const dotsWidth = pageWidth - margins * 2 - textWidth - 5;
  const pageNumber = pageMap["final"] || "";
  
  // Draw section name
  doc.text(finalSectionLabel, margins, yPosition);
  
  // Calculate dot leaders
  const dotCount = Math.floor(dotsWidth / 2);
  let dots = "";
  for (let i = 0; i < dotCount; i++) {
    dots += ". ";
  }
  
  // Draw dot leaders and page number
  doc.text(dots, margins + textWidth + 3, yPosition);
  doc.text(pageNumber.toString(), pageWidth - margins, yPosition, { align: "right" });
}

/**
 * Generate disclaimer section
 */
function generateDisclaimerSection(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("DISCLAIMER", margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + 60, margins + 15);
  
  const disclaimers = [
    "This inventory report provides a record of the fixtures, fittings and contents of the property, and the property's condition at the start of the tenancy.",
    "All items are assumed to be in good condition and free from damage or defects unless otherwise stated.",
    "The inventory should be carefully checked by the tenant on arrival and any discrepancies or additional damages reported within 7 days.",
    "The tenant is responsible for the return of all items listed in the same condition as at the start of tenancy, allowing for reasonable wear and tear.",
    "The inventory was conducted during daylight hours under normal lighting conditions to minimize the risk of overlooking items.",
    "Floor coverings, mattresses, and other soft furnishings have been inspected where accessible, but not moved.",
    "Items stored in lofts, cellars, locked rooms, or inaccessible locations are not included in this inventory.",
    "The inventory does not include assessments of whether appliances or heating systems are in working order.",
    "The Fire & Safety Regulations regarding furnishings, gas, electrical, and similar services are the responsibility of the instructing principal.",
    "Testing of electrical appliances or heating systems is not undertaken as part of the inventory process.",
    "It is the landlord's responsibility to ensure all safety and regulatory requirements are met.",
    "Wall surfaces have been inspected and noted from floor level. Any marks or damage at high level may not be noted.",
    "Spot-checking of bed linen and towels has been undertaken when possible.",
    "If no significant damage is detailed in this report, it is assumed items are free from defects.",
    "The accuracy of the inventory will be determined by the clerk's judgment and not limited by time restrictions.",
    "Windows may have been checked for obvious defects but not for detailed functionality.",
    "The inventory remains the property of the clerk until full payment has been received.",
    "Any discrepancies must be reported in writing within 7 days of receiving this inventory. After this period, the inventory will be deemed accepted as accurate.",
    "The tenant should note that this inventory will be used as the basis for the check-out report at the end of tenancy.",
    "This inventory has been prepared to provide a fair and accurate record of the contents and condition of the property.",
    "The landlord and tenant should carefully check this document to ensure it is an accurate representation of the property at the start of the tenancy."
  ];
  
  let yPosition = margins + 30;
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  // Add numbered disclaimer points with tight spacing
  disclaimers.forEach((disclaimer, index) => {
    const number = index + 1;
    const formattedText = `${number}. ${disclaimer}`;
    
    // Split text to fit the page width with justification
    const splitText = doc.splitTextToSize(formattedText, pageWidth - (margins * 2));
    
    doc.text(splitText, margins, yPosition, { align: "justify" });
    
    // Increment y position for next paragraph (with tight spacing)
    yPosition += (splitText.length * 6);
  });
}

/**
 * Generate summary tables
 */
function generateSummaryTables(doc: jsPDF, report: Report, property: Property): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("SUMMARY", margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + 50, margins + 15);
  
  let yPosition = margins + 30;
  
  // General Summary Table
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("General Summary", margins, yPosition);
  yPosition += 10;
  
  // Two-column layout for general summary
  const leftColumnX = margins;
  const rightColumnX = pageWidth / 2 + 10;
  
  // Table headers
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  doc.text("Item", leftColumnX, yPosition);
  doc.text("Details", rightColumnX, yPosition);
  yPosition += 5;
  
  // Horizontal line under headers
  doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
  doc.line(margins, yPosition, pageWidth - margins, yPosition);
  yPosition += 8;
  
  // Table data
  doc.setFont(pdfStyles.fonts.body, "normal");
  
  const summaryItems = [
    { label: "Property Address", value: `${property.address}, ${property.city}, ${property.state} ${property.zipCode}` },
    { label: "Report Date", value: report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "Not specified" },
    { label: "Conducted By", value: report.reportInfo?.clerk || "Not specified" },
    { label: "Property Type", value: property.type || "Not specified" },
    { label: "Number of Rooms", value: report.rooms.length.toString() },
    { label: "Tenant Name", value: report.reportInfo?.tenantName || "Not specified" },
    { label: "Report Status", value: report.status || "Draft" }
  ];
  
  for (const item of summaryItems) {
    doc.setFont(pdfStyles.fonts.body, "normal");
    doc.text(item.label, leftColumnX, yPosition);
    doc.text(item.value, rightColumnX, yPosition);
    yPosition += 8;
  }
  
  yPosition += 15;
  
  // Cleaning Summary Table (if data exists)
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Cleaning Summary", margins, yPosition);
  yPosition += 10;
  
  // Table headers
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  doc.text("Room", leftColumnX, yPosition);
  doc.text("Cleanliness Rating", rightColumnX, yPosition);
  yPosition += 5;
  
  // Horizontal line under headers
  doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
  doc.line(margins, yPosition, pageWidth - margins, yPosition);
  yPosition += 8;
  
  // Table data
  if (report.rooms.length > 0) {
    for (const room of report.rooms) {
      doc.setFont(pdfStyles.fonts.body, "normal");
      doc.text(room.name, leftColumnX, yPosition);
      // Derive cleanliness from general condition or set as "Not specified"
      const cleanliness = room.generalCondition ? getCleanlinessRating(room.generalCondition) : "Not specified";
      doc.text(cleanliness, rightColumnX, yPosition);
      yPosition += 8;
    }
  } else {
    doc.setFont(pdfStyles.fonts.body, "italic");
    doc.text("No rooms available", leftColumnX, yPosition);
    yPosition += 8;
  }
}

/**
 * Generate room section with components
 */
async function generateRoomSection(doc: jsPDF, room: Room, roomIndex: number): Promise<void> {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Room header with number
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text(`${roomIndex}. ${room.name.toUpperCase()}`, margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + doc.getTextWidth(`${roomIndex}. ${room.name.toUpperCase()}`) + 5, margins + 15);
  
  let yPosition = margins + 30;
  
  // General room condition
  if (room.generalCondition) {
    doc.setFont(pdfStyles.fonts.body, "bold");
    doc.setFontSize(pdfStyles.fontSizes.normal);
    doc.text("General Condition:", margins, yPosition);
    
    doc.setFont(pdfStyles.fonts.body, "normal");
    const splitCondition = doc.splitTextToSize(room.generalCondition, pageWidth - (margins * 2) - 20);
    yPosition += 8;
    doc.text(splitCondition, margins, yPosition);
    yPosition += splitCondition.length * 6 + 10;
  }
  
  // Room Images
  if (room.images && room.images.length > 0) {
    // Only show up to 4 images per room
    const maxImages = Math.min(room.images.length, 4);
    const imagesPerRow = 2;
    const imageWidth = (pageWidth - (margins * 2) - 10) / imagesPerRow;
    const imageHeight = 40;
    
    let imageYPosition = yPosition;
    
    for (let i = 0; i < maxImages; i++) {
      const col = i % imagesPerRow;
      const row = Math.floor(i / imagesPerRow);
      const xPos = margins + (col * (imageWidth + 5));
      const yPos = imageYPosition + (row * (imageHeight + 15));
      
      try {
        // Compress image before adding to PDF
        const compressedImage = await compressDataURLImage(
          room.images[i].url,
          `room_${room.id}_image_${i}`,
          600,
          600,
          0.7
        );
        
        doc.addImage(compressedImage, 'JPEG', xPos, yPos, imageWidth, imageHeight);
        
        // Add timestamp below image if available
        if (room.images[i].timestamp) {
          doc.setFont(pdfStyles.fonts.body, "italic");
          doc.setFontSize(pdfStyles.fontSizes.small);
          const timestamp = new Date(room.images[i].timestamp).toLocaleString();
          doc.text(timestamp, xPos + imageWidth / 2, yPos + imageHeight + 5, { align: "center" });
        }
      } catch (error) {
        console.error(`Error adding room image ${i}:`, error);
        
        // Draw placeholder if image can't be loaded
        doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
        doc.setFillColor(pdfStyles.colors.white[0], pdfStyles.colors.white[1], pdfStyles.colors.white[2]);
        doc.rect(xPos, yPos, imageWidth, imageHeight, 'FD');
        
        doc.setFont(pdfStyles.fonts.body, "italic");
        doc.setFontSize(pdfStyles.fontSizes.small);
        doc.text("Image not available", xPos + imageWidth / 2, yPos + imageHeight / 2, { align: "center" });
      }
    }
    
    // Update y position after images
    yPosition = imageYPosition + (Math.ceil(maxImages / imagesPerRow) * (imageHeight + 15)) + 10;
  }
  
  // Components
  if (room.components && room.components.length > 0) {
    // Sort components - standard ones first, then custom ones
    const sortedComponents = [...room.components].sort((a, b) => {
      if (a.isCustom && !b.isCustom) return 1;
      if (!a.isCustom && b.isCustom) return -1;
      return a.name.localeCompare(b.name);
    });
    
    // Generate component sections
    for (let i = 0; i < sortedComponents.length; i++) {
      const component = sortedComponents[i];
      
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPosition = margins;
        
        // Add room continuation header
        doc.setFont(pdfStyles.fonts.header, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        doc.text(`${roomIndex}. ${room.name} (continued)`, margins, yPosition);
        yPosition += 15;
      }
      
      // Section header with component number
      const componentNumber = `${roomIndex}.${i+1}`;
      doc.setFont(pdfStyles.fonts.header, "bold");
      doc.setFontSize(pdfStyles.fontSizes.sectionTitle);
      doc.text(`${componentNumber} ${component.name}`, margins, yPosition);
      yPosition += 10;
      
      // Component description
      if (component.description) {
        doc.setFont(pdfStyles.fonts.body, "normal");
        doc.setFontSize(pdfStyles.fontSizes.normal);
        
        const splitDescription = doc.splitTextToSize(component.description, pageWidth - (margins * 2) - 10);
        doc.text(splitDescription, margins, yPosition);
        yPosition += splitDescription.length * 6 + 5;
      }
      
      // Component condition
      if (component.condition) {
        const formattedCondition = conditionRatingToText(component.condition);
        
        doc.setFont(pdfStyles.fonts.body, "bold");
        doc.text("Condition:", margins, yPosition);
        doc.setFont(pdfStyles.fonts.body, "normal");
        doc.text(formattedCondition, margins + 25, yPosition);
        yPosition += 7;
      }
      
      // Additional condition details
      if (component.conditionSummary) {
        const splitSummary = doc.splitTextToSize(component.conditionSummary, pageWidth - (margins * 2) - 10);
        doc.text(splitSummary, margins, yPosition);
        yPosition += splitSummary.length * 6 + 3;
      }
      
      // Condition points as bullet points
      if (component.conditionPoints && component.conditionPoints.length > 0) {
        yPosition += 2;
        for (const point of component.conditionPoints) {
          if (point.trim()) {
            doc.text("• " + point, margins + 5, yPosition);
            yPosition += 6;
          }
        }
        yPosition += 3;
      }
      
      // Component notes
      if (component.notes) {
        yPosition += 2;
        doc.setFont(pdfStyles.fonts.body, "bold");
        doc.text("Notes:", margins, yPosition);
        yPosition += 6;
        
        doc.setFont(pdfStyles.fonts.body, "normal");
        const splitNotes = doc.splitTextToSize(component.notes, pageWidth - (margins * 2) - 10);
        doc.text(splitNotes, margins + 5, yPosition);
        yPosition += splitNotes.length * 6 + 5;
      }
      
      // Component images
      if (component.images && component.images.length > 0) {
        // Only show up to 3 images per component
        const maxImages = Math.min(component.images.length, 3);
        const imageWidth = (pageWidth - (margins * 2) - 10) / maxImages;
        const imageHeight = 30;
        
        let imageYPosition = yPosition;
        
        for (let j = 0; j < maxImages; j++) {
          const xPos = margins + (j * (imageWidth + 5));
          
          try {
            // Compress image before adding to PDF
            const compressedImage = await compressDataURLImage(
              component.images[j].url,
              `component_${component.id}_image_${j}`,
              400,
              400,
              0.7
            );
            
            doc.addImage(compressedImage, 'JPEG', xPos, imageYPosition, imageWidth, imageHeight);
            
            // Add timestamp below image if available
            if (component.images[j].timestamp) {
              doc.setFont(pdfStyles.fonts.body, "italic");
              doc.setFontSize(pdfStyles.fontSizes.small);
              const timestamp = new Date(component.images[j].timestamp).toLocaleString();
              doc.text(timestamp, xPos + imageWidth / 2, imageYPosition + imageHeight + 5, { align: "center" });
            }
          } catch (error) {
            console.error(`Error adding component image ${j}:`, error);
            
            // Draw placeholder if image can't be loaded
            doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
            doc.setFillColor(pdfStyles.colors.white[0], pdfStyles.colors.white[1], pdfStyles.colors.white[2]);
            doc.rect(xPos, imageYPosition, imageWidth, imageHeight, 'FD');
            
            doc.setFont(pdfStyles.fonts.body, "italic");
            doc.setFontSize(pdfStyles.fontSizes.small);
            doc.text("Image not available", xPos + imageWidth / 2, imageYPosition + imageHeight / 2, { align: "center" });
          }
        }
        
        // Update y position after images
        yPosition = imageYPosition + imageHeight + 15;
      }
    }
  } else {
    // No components found
    doc.setFont(pdfStyles.fonts.body, "italic");
    doc.setFontSize(pdfStyles.fontSizes.normal);
    doc.text("No components have been added to this room.", margins, yPosition);
    yPosition += 10;
  }
}

/**
 * Generate final sections
 */
function generateFinalSections(doc: jsPDF, report: Report, property: Property): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("FINAL NOTES & DECLARATIONS", margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + 100, margins + 15);
  
  let yPosition = margins + 30;
  
  // Safety devices section
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Safety Devices", margins, yPosition);
  yPosition += 10;
  
  // Two-column layout for safety devices
  const leftColumnX = margins;
  const rightColumnX = pageWidth / 2 + 10;
  
  // Smoke alarms
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  doc.text("Smoke Alarms:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("Present and tested", rightColumnX, yPosition);
  yPosition += 8;
  
  // CO Detectors
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("CO Detectors:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("Present and tested", rightColumnX, yPosition);
  yPosition += 20;
  
  // Keys and security section
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Keys & Security", margins, yPosition);
  yPosition += 10;
  
  // Keys table
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Front Door Keys:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("2 sets provided", rightColumnX, yPosition);
  yPosition += 8;
  
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Window Keys:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("1 set provided", rightColumnX, yPosition);
  yPosition += 20;
  
  // Utility meters section
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Utility Meters", margins, yPosition);
  yPosition += 10;
  
  // Meters table
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Electricity Meter Reading:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("12345", rightColumnX, yPosition);
  yPosition += 8;
  
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Gas Meter Reading:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("67890", rightColumnX, yPosition);
  yPosition += 8;
  
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Water Meter Reading:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("54321", rightColumnX, yPosition);
  yPosition += 30;
  
  // Declaration section
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Declaration", margins, yPosition);
  yPosition += 10;
  
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  const declarationText = "I/We have read and agree that this inventory is a fair and accurate assessment of the property and its contents at the start of the tenancy. If any discrepancies are noted, they will be reported in writing within 7 days of receiving this inventory. After this period the inventory will be deemed to be correct and will form the basis of the check-out report at the end of the tenancy.";
  
  const splitDeclaration = doc.splitTextToSize(declarationText, pageWidth - (margins * 2));
  doc.text(splitDeclaration, margins, yPosition);
  yPosition += splitDeclaration.length * 6 + 20;
  
  // Signature fields
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Landlord/Agent Signature:", leftColumnX, yPosition);
  
  // Signature line
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(leftColumnX, yPosition + 10, leftColumnX + 80, yPosition + 10);
  
  doc.text("Date:", leftColumnX, yPosition + 20);
  doc.line(leftColumnX + 20, yPosition + 20, leftColumnX + 80, yPosition + 20);
  
  // Tenant signature field (on right side)
  doc.text("Tenant Signature:", rightColumnX, yPosition);
  
  // Signature line
  doc.line(rightColumnX, yPosition + 10, rightColumnX + 80, yPosition + 10);
  
  doc.text("Date:", rightColumnX, yPosition + 20);
  doc.line(rightColumnX + 20, yPosition + 20, rightColumnX + 80, yPosition + 20);
}

/**
 * Add headers and footers to all pages
 */
function addHeadersAndFooters(doc: jsPDF, propertyAddress: string): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Skip the cover page (page 1)
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Header - property address
    doc.setFont(pdfStyles.fonts.header, "normal");
    doc.setFontSize(pdfStyles.fontSizes.small);
    doc.setTextColor(pdfStyles.colors.gray[0], pdfStyles.colors.gray[1], pdfStyles.colors.gray[2]);
    doc.text(propertyAddress, pageWidth / 2, 10, { align: "center" });
    
    // Header underline
    doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
    doc.setLineWidth(0.5);
    doc.line(pdfStyles.margins.page, 12, pageWidth - pdfStyles.margins.page, 12);
    
    // Footer - page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    
    // Footer separator
    doc.line(pdfStyles.margins.page, pageHeight - 15, pageWidth - pdfStyles.margins.page, pageHeight - 15);
  }
}

/**
 * Helper function to derive cleanliness rating from general condition text
 */
function getCleanlinessRating(condition: string): string {
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
