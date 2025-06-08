
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfStyles } from "../styles";
import { addCompressedImage } from "../utils/imageHelpers";
import { getCoverPageTitle, getPropertyTitle } from "../utils/reportNaming";

/**
 * Generate the cover page
 */
export async function generateCoverPage(doc: jsPDF, report: Report, property: Property): Promise<void> {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Title - INSPECTION REPORT or PROPERTY COMPARISON
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title + 6);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  
  // Use centralized title generation
  const title = getCoverPageTitle(report);
  doc.text(title, pageWidth / 2, 60, { align: "center" });
  
  // Property Name - centered and prominent using centralized utility
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  const propertyTitle = getPropertyTitle(property);
  doc.text(propertyTitle, pageWidth / 2, 80, { align: "center" });
  doc.text(`${property.city}, ${property.state} ${property.zipCode}`, pageWidth / 2, 90, { align: "center" });
  
  // Date and Report Details
  let reportDateString = "Not specified";
  if (report.reportInfo?.reportDate) {
    // Handle both string and Date formats
    const reportDate = typeof report.reportInfo.reportDate === 'string' 
      ? new Date(report.reportInfo.reportDate) 
      : report.reportInfo.reportDate;
    
    reportDateString = reportDate.toLocaleDateString('en-GB', {
      day: '2-digit', 
      month: 'long', 
      year: 'numeric'
    });
  }
  
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  doc.text(`Date: ${reportDateString}`, pageWidth / 2, 110, { align: "center" });
  
  if (report.reportInfo?.clerk) {
    doc.text(`Clerk: ${report.reportInfo.clerk}`, pageWidth / 2, 120, { align: "center" });
  }
  
  // Add comparison-specific info if applicable
  if (report.type === "comparison") {
    doc.text("Report Type: Comparison Analysis", pageWidth / 2, 130, { align: "center" });
  }
  
  // Add the logo
  try {
    await addCompressedImage(
      doc,
      "/lovable-uploads/d0f6bc71-e952-4739-aa12-54a7a8bb41ae.png",
      "vi_logo",
      pageWidth / 2 - 35,
      140,
      70,
      40,
      undefined,
      true // maintain aspect ratio
    );
    
  } catch (error) {
    console.error("Error adding logo to PDF:", error);
    // Fallback to placeholder if logo fails to load
    doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
    doc.setLineWidth(0.5);
    doc.rect(pageWidth / 2 - 35, 140, 70, 40);
    doc.setFontSize(pdfStyles.fontSizes.small);
    doc.text("Logo", pageWidth / 2, 160, { align: "center" });
  }
}
