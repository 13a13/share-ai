
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfStyles } from "../styles";

/**
 * Generate the cover page
 */
export async function generateCoverPage(doc: jsPDF, report: Report, property: Property): Promise<void> {
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
