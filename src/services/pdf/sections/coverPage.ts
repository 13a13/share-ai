
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfStyles } from "../styles";
import { addCompressedImage } from "../utils/imageHelpers";

/**
 * Generate the cover page
 */
export async function generateCoverPage(doc: jsPDF, report: Report, property: Property): Promise<void> {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Title - VERIVYVIFION INSPECTION REPORT or PROPERTY COMPARISON
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title + 6);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  
  // Use appropriate title based on report type
  const title = report.type === "comparison" ? "PROPERTY COMPARISON" : "VERIVYVIFION INSPECTION REPORT";
  doc.text(title, pageWidth / 2, 60, { align: "center" });
  
  // Property Address - centered and prominent
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text(property.address, pageWidth / 2, 80, { align: "center" });
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
  
  // Add the new VerifyVision logo with transparent background
  try {
    await addCompressedImage(
      doc,
      "/lovable-uploads/c79b35c0-ad5a-40c2-a4cb-3335cfc85003.png",
      "verivyvision_logo",
      pageWidth / 2 - 25,
      140,
      50,
      25,
      undefined,
      true // maintain aspect ratio
    );
    
  } catch (error) {
    console.error("Error adding logo to PDF:", error);
    // Fallback to placeholder if logo fails to load
    doc.setDrawColor(pdfStyles.colors.lightGray[0], pdfStyles.colors.lightGray[1], pdfStyles.colors.lightGray[2]);
    doc.setLineWidth(0.5);
    doc.rect(pageWidth / 2 - 25, 140, 50, 25);
    doc.setFontSize(pdfStyles.fontSizes.small);
    doc.text("Logo", pageWidth / 2, 152, { align: "center" });
  }
  
  // Footer at bottom of page
  doc.setFont(pdfStyles.fonts.body, "italic");
  doc.setFontSize(pdfStyles.fontSizes.small);
  doc.text(
    "This inspection report was created using VerifyVision AI Property Reports", 
    pageWidth / 2, 
    pageHeight - 20, 
    { align: "center" }
  );
}
