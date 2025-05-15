
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { generateCoverPage } from "./sections/coverPage";
import { generateTableOfContents } from "./sections/tableOfContents";
import { generateDisclaimerSection } from "./sections/disclaimer";
import { generateSummaryTables } from "./sections/summaryTables";
import { generateRoomSection } from "./sections/roomSection";
import { generateFinalSections } from "./sections/finalSections";
import { generateComparisonSection } from "./sections/comparisonSection";
import { addHeadersAndFooters } from "./utils/headerFooter";
import { useState } from "react";
import { isIosDevice } from "@/utils/pdfUtils";

export type PDFGenerationStatus = "idle" | "generating" | "complete" | "error";

/**
 * Hook for generating PDF reports in Green Kite style
 */
export const usePDFGeneration = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PDFGenerationStatus>("idle");
  
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
    setStatus("generating");
    
    try {
      console.log("Starting PDF generation for report:", report.id);
      
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Set up document metadata
      doc.setProperties({
        title: `Property Report - ${property.address}`,
        subject: report.type === "comparison" 
          ? `Comparison Report for ${property.address}` 
          : `Inventory and Check In Report for ${property.address}`,
        author: report.reportInfo?.clerk || "Share.AI",
        creator: "Share.AI Property Reports"
      });
      
      // Preload all images to avoid async issues
      console.log("Preloading images...");
      await preloadImages(report);
      
      // Generate sections
      console.log("Generating cover page...");
      await generateCoverPage(doc, report, property);
      doc.addPage();
      
      // Track page numbers for table of contents
      const pageMap: Record<string, number> = {};
      let currentPage = 2; // Cover is page 1

      // Special handling for comparison report
      if (report.type === "comparison" && report.reportInfo?.comparisonText) {
        // Add table of contents as page 2
        pageMap["contents"] = currentPage++;
        generateTableOfContents(doc, pageMap, null); // No rooms in ToC for comparison report
        doc.addPage();
        
        // Add disclaimer section as page 3
        pageMap["disclaimer"] = currentPage++;
        generateDisclaimerSection(doc);
        doc.addPage();
        
        // Add comparison section as page 4
        pageMap["comparison"] = currentPage++;
        generateComparisonSection(doc, report);
      } else {
        // Standard report processing
        
        // Add table of contents as page 2
        pageMap["contents"] = currentPage++;
        generateTableOfContents(doc, pageMap, report);
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
        console.log("Generating room sections...");
        for (let i = 0; i < report.rooms.length; i++) {
          const room = report.rooms[i];
          console.log(`Processing room ${i+1}/${report.rooms.length}: ${room.name}`);
          
          // Record page number for this room
          pageMap[room.id] = currentPage++;
          
          // Generate room section
          await generateRoomSection(doc, room, i + 1);
          
          // Add new page for next room (except for last room)
          if (i < report.rooms.length - 1) {
            doc.addPage();
          }
        }
      }
      
      // Add headers and footers to all pages
      console.log("Adding headers and footers...");
      addHeadersAndFooters(doc, property.address);
      
      // Convert the PDF to base64
      console.log("Finalizing PDF...");
      const pdfBase64 = doc.output('datauristring');
      
      // Don't show success toast for comparison reports
      if (report.type !== "comparison") {
        toast({
          title: "PDF Generated Successfully",
          description: "Your report is ready to download.",
          variant: "default",
        });
      }
      
      setStatus("complete");
      console.log("PDF generation complete");
      
      return pdfBase64;
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Show error toast
      toast({
        title: "PDF Generation Failed",
        description: isIosDevice() 
          ? "There was an error generating your PDF. iOS has limitations with large PDFs. Try with fewer images or rooms."
          : "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
      
      setStatus("error");
      throw error;
    }
  };
  
  /**
   * Preload all images from the report to ensure they're cached
   * Uses a dynamic timeout based on image count and device capabilities
   */
  const preloadImages = async (report: Report): Promise<void> => {
    const imagePromises: Promise<void>[] = [];
    
    // Gather all image URLs from the report
    const imageUrls: string[] = [];
    
    // Add room images
    report.rooms.forEach(room => {
      if (room.images && room.images.length > 0) {
        room.images.forEach(img => {
          if (img.url && img.url.trim() !== '') {
            imageUrls.push(img.url);
          }
        });
      }
      
      // Add component images
      if (room.components && room.components.length > 0) {
        room.components.forEach(component => {
          if (component.images && component.images.length > 0) {
            component.images.forEach(img => {
              if (img.url && img.url.trim() !== '') {
                imageUrls.push(img.url);
              }
            });
          }
        });
      }
    });
    
    // Skip if no images to preload
    if (imageUrls.length === 0) {
      return;
    }
    
    // Calculate dynamic timeout based on number of images and device
    // iOS devices may need more time due to performance constraints
    const baseTimeout = 5000; // Base 5 seconds
    const perImageTime = 500; // 0.5 second per image
    const iosMultiplier = isIosDevice() ? 1.5 : 1; // 50% more time for iOS
    
    const dynamicTimeout = Math.min(
      30000, // Cap at 30 seconds max
      Math.max(
        baseTimeout,
        (imageUrls.length * perImageTime * iosMultiplier) + baseTimeout
      )
    );
    
    console.log(`Dynamic image preload timeout set to ${dynamicTimeout}ms for ${imageUrls.length} images`);
    
    // Track preloaded images for retry logic
    const preloadedImages = new Set<string>();
    const failedImages = new Set<string>();
    
    // Preload each image
    imageUrls.forEach(url => {
      const promise = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          preloadedImages.add(url);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to preload image: ${url}`);
          failedImages.add(url);
          resolve(); // Resolve anyway to continue the process
        };
        img.src = url;
      });
      
      imagePromises.push(promise);
    });
    
    // Wait for all images to preload (or fail) with dynamic timeout
    const timeoutPromise = new Promise<void>(resolve => setTimeout(() => {
      const loadedCount = preloadedImages.size;
      const failedCount = failedImages.size;
      const totalCount = imageUrls.length;
      
      console.log(`Preload timed out: ${loadedCount}/${totalCount} images loaded, ${failedCount} failed`);
      resolve();
    }, dynamicTimeout));
    
    await Promise.race([
      Promise.all(imagePromises),
      timeoutPromise
    ]);
    
    // Try one more time with failed images if there aren't too many
    if (failedImages.size > 0 && failedImages.size <= 5) {
      console.log(`Retrying ${failedImages.size} failed images...`);
      const retryPromises = Array.from(failedImages).map(url => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            console.log(`Successfully loaded image on retry: ${url}`);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load image on retry: ${url}`);
            resolve();
          };
          img.src = url;
        });
      });
      
      // Short timeout for retry attempts
      const retryTimeout = new Promise<void>(resolve => 
        setTimeout(resolve, Math.min(3000, failedImages.size * 1000))
      );
      
      await Promise.race([
        Promise.all(retryPromises),
        retryTimeout
      ]);
    }
    
    const finalLoadedCount = preloadedImages.size;
    console.log(`Preloaded ${finalLoadedCount}/${imageUrls.length} images`);
    
    // iOS-specific warning for large numbers of images
    if (isIosDevice() && imageUrls.length > 50) {
      console.warn(`Large number of images (${imageUrls.length}) may cause performance issues on iOS`);
    }
  };
  
  return {
    generatePDF,
    status
  };
};
