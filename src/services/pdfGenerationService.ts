
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Report, Property, Room, RoomComponent } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export type PDFGenerationStatus = "idle" | "generating" | "complete" | "error";

// PDF generation service for reports
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
      
      // Set font sizes
      const titleSize = 18;
      const subtitleSize = 14;
      const headerSize = 12;
      const normalSize = 10;
      const smallSize = 8;
      
      // Set colors
      const primaryColor = [0, 123, 255]; // Blue
      const accentColor = [40, 167, 169]; // Teal (shareai-teal)
      
      let currentPage = 1;
      
      // Helper function for adding headers and footers
      const addHeaderAndFooter = () => {
        // Footer on all pages except cover
        if (currentPage > 1) {
          const pageWidth = doc.internal.pageSize.width;
          doc.setFontSize(smallSize);
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Share.AI Property Report - Page ${currentPage}`,
            pageWidth / 2,
            285,
            { align: "center" }
          );
          doc.text(
            `Generated on ${new Date().toLocaleDateString()}`,
            pageWidth / 2,
            290,
            { align: "center" }
          );
        }
        currentPage++;
      };
      
      // 1. COVER PAGE
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 0, 210, 30, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(titleSize);
      doc.setFont("helvetica", "bold");
      doc.text("PROPERTY INVENTORY REPORT", 105, 20, { align: "center" });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(subtitleSize);
      doc.text(`${report.type.replace('_', ' ').toUpperCase()} REPORT`, 105, 50, { align: "center" });
      
      doc.setFontSize(normalSize);
      doc.setFont("helvetica", "normal");
      
      // Property Details
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 70, 170, 70, "F");
      
      doc.setFont("helvetica", "bold");
      doc.text("Property Details", 30, 85);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Address: ${property.address}`, 30, 95);
      doc.text(`City: ${property.city}`, 30, 105);
      doc.text(`State: ${property.state}`, 30, 115);
      doc.text(`Zip Code: ${property.zipCode}`, 30, 125);
      
      // Report Information
      if (report.reportInfo) {
        doc.setFont("helvetica", "bold");
        doc.text("Report Information", 105, 85);
        doc.setFont("helvetica", "normal");
        
        doc.text(`Report Date: ${report.reportInfo.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "Not specified"}`, 105, 95);
        doc.text(`Inspector: ${report.reportInfo.clerk || "Not specified"}`, 105, 105);
        doc.text(`Status: ${report.status.replace('_', ' ')}`, 105, 115);
        
        if (report.reportInfo.tenantName) {
          doc.text(`Tenant: ${report.reportInfo.tenantName}`, 105, 125);
        }
      }
      
      doc.setFontSize(smallSize);
      doc.text(`Report ID: ${report.id}`, 20, 280);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 285);
      
      addHeaderAndFooter();
      
      // 2. TABLE OF CONTENTS
      doc.addPage();
      addHeaderAndFooter();
      
      doc.setFontSize(titleSize);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text("TABLE OF CONTENTS", 105, 20, { align: "center" });
      
      doc.setFontSize(normalSize);
      doc.setTextColor(0, 0, 0);
      
      // Calculate the starting page number for rooms (cover + TOC)
      let pageCounter = 3;
      const roomPageMap: Record<string, number> = {};
      
      // List rooms with page numbers
      if (report.rooms.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Rooms:", 20, 40);
        doc.setFont("helvetica", "normal");
        
        report.rooms.forEach((room, index) => {
          roomPageMap[room.id] = pageCounter;
          doc.text(`${index + 1}. ${room.name}`, 30, 50 + (index * 10));
          doc.text(`Page ${pageCounter}`, 150, 50 + (index * 10));
          
          // Each room takes at least one page
          pageCounter++;
        });
      } else {
        doc.text("No rooms in this report.", 20, 40);
      }
      
      // Add Summary section to TOC
      doc.text("Summary and Disclaimers", 30, 50 + (report.rooms.length * 10));
      doc.text(`Page ${pageCounter}`, 150, 50 + (report.rooms.length * 10));
      
      // 3. ROOM SECTIONS
      if (report.rooms.length > 0) {
        // Process each room
        for (const room of report.rooms) {
          doc.addPage();
          addHeaderAndFooter();
          
          // Room Header
          doc.setFontSize(titleSize);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text(room.name, 105, 20, { align: "center" });
          
          doc.setFontSize(normalSize);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          doc.text(`Room Type: ${room.type.replace('_', ' ')}`, 105, 30, { align: "center" });
          
          doc.setTextColor(0, 0, 0);
          
          // General Condition
          if (room.generalCondition) {
            doc.setFontSize(subtitleSize);
            doc.setFont("helvetica", "bold");
            doc.text("General Condition", 20, 45);
            doc.setFontSize(normalSize);
            doc.setFont("helvetica", "normal");
            
            // Split long text into multiple lines
            const splitCondition = doc.splitTextToSize(room.generalCondition, 170);
            doc.text(splitCondition, 20, 55);
          }
          
          // Components Section
          let yPosition = room.generalCondition ? 55 + (doc.splitTextToSize(room.generalCondition, 170).length * 7) : 45;
          
          if (room.components && room.components.length > 0) {
            doc.setFontSize(subtitleSize);
            doc.setFont("helvetica", "bold");
            doc.text("Components", 20, yPosition + 10);
            
            yPosition += 20;
            
            // Process each component
            for (const component of room.components) {
              // Check if we need a new page
              if (yPosition > 250) {
                doc.addPage();
                addHeaderAndFooter();
                yPosition = 20;
              }
              
              // Component box
              doc.setFillColor(245, 245, 245);
              doc.roundedRect(15, yPosition, 180, 50, 3, 3, "F");
              
              // Component title
              doc.setFontSize(headerSize);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
              doc.text(component.name, 20, yPosition + 10);
              
              // Condition badge
              if (component.condition) {
                doc.setFillColor(getConditionColor(component.condition));
                doc.roundedRect(150, yPosition + 5, 40, 7, 2, 2, "F");
                doc.setFontSize(smallSize);
                doc.setTextColor(255, 255, 255);
                doc.text(component.condition.toUpperCase(), 170, yPosition + 10, { align: "center" });
              }
              
              // Component description
              doc.setFontSize(normalSize);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(0, 0, 0);
              
              if (component.description) {
                const splitDesc = doc.splitTextToSize(component.description, 170);
                doc.text(splitDesc, 20, yPosition + 20);
              }
              
              // Component notes
              if (component.notes) {
                doc.setFont("helvetica", "italic");
                doc.setTextColor(100, 100, 100);
                const splitNotes = doc.splitTextToSize(`Notes: ${component.notes}`, 170);
                doc.text(splitNotes, 20, yPosition + 35);
              }
              
              // Move down for the next component
              yPosition += 60;
              
              // Add component images if they exist
              if (component.images && component.images.length > 0) {
                // For now, we'll just add a placeholder for images
                // In a real implementation, you would load and embed the actual images
                doc.setFillColor(220, 220, 220);
                doc.roundedRect(20, yPosition, 170, 20, 3, 3, "F");
                
                doc.setFontSize(smallSize);
                doc.setTextColor(100, 100, 100);
                doc.text(`This component has ${component.images.length} image(s)`, 105, yPosition + 10, { align: "center" });
                
                yPosition += 30;
              }
              
              // Check if we need a new page for the next component
              if (yPosition > 240 && room.components.indexOf(component) < room.components.length - 1) {
                doc.addPage();
                addHeaderAndFooter();
                yPosition = 20;
              }
            }
          } else {
            doc.text("No components have been added to this room.", 20, yPosition + 10);
          }
        }
      }
      
      // 4. FINAL SUMMARY & DISCLAIMERS
      doc.addPage();
      addHeaderAndFooter();
      
      doc.setFontSize(titleSize);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text("SUMMARY & DISCLAIMERS", 105, 20, { align: "center" });
      
      doc.setFontSize(normalSize);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      // Summary
      doc.setFontSize(subtitleSize);
      doc.text("Report Summary", 20, 40);
      doc.setFontSize(normalSize);
      
      const summaryText = `This report includes an assessment of ${report.rooms.length} room(s) at the property located at ${property.address}, ${property.city}, ${property.state} ${property.zipCode}. The inspection was conducted on ${report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "an unspecified date"}.`;
      
      const splitSummary = doc.splitTextToSize(summaryText, 170);
      doc.text(splitSummary, 20, 50);
      
      // Disclaimers
      doc.setFontSize(subtitleSize);
      doc.text("Disclaimers", 20, 70);
      doc.setFontSize(normalSize);
      
      let disclaimerY = 80;
      
      if (report.disclaimers && report.disclaimers.length > 0) {
        for (const disclaimer of report.disclaimers) {
          const splitDisclaimer = doc.splitTextToSize(`• ${disclaimer}`, 170);
          doc.text(splitDisclaimer, 20, disclaimerY);
          disclaimerY += splitDisclaimer.length * 7;
        }
      } else {
        // Default disclaimers if none are provided
        const defaultDisclaimers = [
          "This report represents the condition of the property at the time of inspection only.",
          "Areas not accessible for inspection are not included in this report.",
          "The inspector is not required to move furniture or personal items.",
          "This report is not a warranty or guarantee of any kind."
        ];
        
        for (const disclaimer of defaultDisclaimers) {
          const splitDisclaimer = doc.splitTextToSize(`• ${disclaimer}`, 170);
          doc.text(splitDisclaimer, 20, disclaimerY);
          disclaimerY += splitDisclaimer.length * 7;
        }
      }
      
      // Signature section
      doc.setFontSize(subtitleSize);
      doc.text("Signatures", 20, 200);
      
      doc.line(20, 220, 90, 220); // Inspector signature line
      doc.line(120, 220, 190, 220); // Client signature line
      
      doc.setFontSize(smallSize);
      doc.text("Inspector", 55, 230);
      doc.text("Client", 155, 230);
      
      // Convert the PDF to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      // Show success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your report is ready to download.",
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

// Helper function to get color for condition badges
function getConditionColor(condition: string): number[] {
  switch (condition.toLowerCase()) {
    case 'excellent':
      return [46, 204, 113]; // Green
    case 'good':
      return [39, 174, 96]; // Dark green
    case 'fair':
      return [241, 196, 15]; // Yellow
    case 'poor':
      return [230, 126, 34]; // Orange
    case 'damaged':
      return [231, 76, 60]; // Red
    default:
      return [149, 165, 166]; // Gray
  }
}
