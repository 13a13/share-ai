
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { Colors, Fonts, pdfStyles } from "../styles";

/**
 * Generates the property summary section of the PDF
 * @param doc PDF document
 * @param report Report data
 */
export const generatePropertySummarySection = (doc: jsPDF, report: Report): void => {
  // Set the position at the top of the page
  let yPos = 20;
  
  // Add section title
  doc.setFont(Fonts.HEADER_FONT, "bold");
  doc.setFontSize(14);
  doc.setTextColor(Colors.PRIMARY[0], Colors.PRIMARY[1], Colors.PRIMARY[2]);
  doc.text("PROPERTY SUMMARY", 14, yPos);
  yPos += 10;
  
  // Add horizontal line
  doc.setDrawColor(Colors.BORDER[0], Colors.BORDER[1], Colors.BORDER[2]);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, doc.internal.pageSize.width - 14, yPos);
  yPos += 8;
  
  // Function to add a summary section
  const addSummarySection = (title: string, content: string | undefined): number => {
    if (!content) return 0;
    
    doc.setFont(Fonts.HEADER_FONT, "bold");
    doc.setFontSize(12);
    doc.setTextColor(Colors.TEXT_DARK[0], Colors.TEXT_DARK[1], Colors.TEXT_DARK[2]);
    doc.text(title, 14, yPos);
    yPos += 6;
    
    doc.setFont(Fonts.BODY_FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(Colors.TEXT[0], Colors.TEXT[1], Colors.TEXT[2]);
    
    // Split text to fit width
    const textLines = doc.splitTextToSize(content, doc.internal.pageSize.width - 28);
    doc.text(textLines, 14, yPos);
    yPos += textLines.length * 5 + 8;
    
    return textLines.length * 5 + 14; // Return height used
  };
  
  // Add overall summaries if available
  if (report.overallConditionSummary) {
    addSummarySection("Overall Condition", report.overallConditionSummary);
  }
  
  if (report.overallCleaningSummary) {
    addSummarySection("Overall Cleanliness", report.overallCleaningSummary);
  }
  
  // Add category summaries if available
  if (report.summaryCategoriesData) {
    const categories = {
      walls: "Walls",
      ceilings: "Ceilings",
      floors: "Floors",
      contents: "Contents & Fixtures",
      lighting: "Lighting & Switches",
      kitchen: "Kitchen & Appliances"
    };
    
    // Add horizontal line to separate overall from category summaries
    doc.setDrawColor(Colors.BORDER_LIGHT[0], Colors.BORDER_LIGHT[1], Colors.BORDER_LIGHT[2]);
    doc.setLineWidth(0.2);
    doc.line(14, yPos - 4, doc.internal.pageSize.width - 14, yPos - 4);
    
    doc.setFont(Fonts.HEADER_FONT, "bold");
    doc.setFontSize(12);
    doc.setTextColor(Colors.PRIMARY[0], Colors.PRIMARY[1], Colors.PRIMARY[2]);
    doc.text("Category Details", 14, yPos);
    yPos += 8;
    
    // Add each category summary
    for (const [key, title] of Object.entries(categories)) {
      const categoryData = report.summaryCategoriesData[key as keyof typeof report.summaryCategoriesData];
      if (!categoryData) continue;
      
      // Check if we need to add a new page
      if (yPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add category title
      doc.setFont(Fonts.HEADER_FONT, "bold");
      doc.setFontSize(11);
      doc.setTextColor(Colors.TEXT_DARK[0], Colors.TEXT_DARK[1], Colors.TEXT_DARK[2]);
      doc.text(title, 14, yPos);
      yPos += 6;
      
      // Add condition summary
      if (categoryData.conditionSummary) {
        doc.setFont(Fonts.BODY_FONT, "italic");
        doc.setFontSize(9);
        doc.setTextColor(Colors.TEXT_LIGHT[0], Colors.TEXT_LIGHT[1], Colors.TEXT_LIGHT[2]);
        doc.text("Condition:", 14, yPos);
        
        doc.setFont(Fonts.BODY_FONT, "normal");
        doc.setTextColor(Colors.TEXT[0], Colors.TEXT[1], Colors.TEXT[2]);
        const conditionLines = doc.splitTextToSize(categoryData.conditionSummary, doc.internal.pageSize.width - 40);
        doc.text(conditionLines, 40, yPos);
        yPos += conditionLines.length * 5;
      }
      
      // Add cleanliness summary
      if (categoryData.cleanlinessSummary) {
        doc.setFont(Fonts.BODY_FONT, "italic");
        doc.setFontSize(9);
        doc.setTextColor(Colors.TEXT_LIGHT[0], Colors.TEXT_LIGHT[1], Colors.TEXT_LIGHT[2]);
        doc.text("Cleanliness:", 14, yPos);
        
        doc.setFont(Fonts.BODY_FONT, "normal");
        doc.setTextColor(Colors.TEXT[0], Colors.TEXT[1], Colors.TEXT[2]);
        const cleanlinessLines = doc.splitTextToSize(categoryData.cleanlinessSummary, doc.internal.pageSize.width - 40);
        doc.text(cleanlinessLines, 40, yPos);
        yPos += cleanlinessLines.length * 5 + 6;
      }
    }
  }
};
