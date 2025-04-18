import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfStyles } from "../styles";
import { getCleanlinessRating } from "../utils/helpers";

/**
 * Generate summary tables
 */
export function generateSummaryTables(doc: jsPDF, report: Report, property: Property): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  const textWidth = (pageWidth - (margins * 2)) / 2 - 5; // Half width for two columns, minus spacing
  
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
  
  // Table data with text wrapping
  doc.setFont(pdfStyles.fonts.body, "normal");
  
  const summaryItems = [
    { label: "Property Address", value: `${property.address}, ${property.city}, ${property.state} ${property.zipCode}` },
    { label: "Report Date", value: report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "Not specified" },
    { label: "Conducted By", value: report.reportInfo?.clerk || "Not specified" },
    { label: "Property Type", value: property.propertyType || "Not specified" },
    { label: "Number of Rooms", value: report.rooms.length.toString() },
    { label: "Tenant Name", value: report.reportInfo?.tenantName || "Not specified" },
    { label: "Report Status", value: report.status || "Draft" }
  ];
  
  for (const item of summaryItems) {
    doc.setFont(pdfStyles.fonts.body, "normal");
    
    // Left column (label)
    doc.text(item.label, leftColumnX, yPosition);
    
    // Right column (value) with text wrapping
    const wrappedValue = doc.splitTextToSize(item.value, textWidth);
    wrappedValue.forEach((line: string, index: number) => {
      doc.text(line, rightColumnX, yPosition + (index * 6));
    });
    
    // Move to next row, accounting for wrapped text
    yPosition += Math.max(8, wrappedValue.length * 6 + 2);
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
