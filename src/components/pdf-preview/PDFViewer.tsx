import React, { useEffect, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import { createBlobUrl, revokeBlobUrl } from "@/utils/pdfUtils";
import PdfJsViewer from "./PdfJsViewer";

interface PDFViewerProps {
  pdfUrl: string | null;
  regeneratedPdfUrl: string | null;
  isLoading: boolean;
}

const PDFViewer = ({ pdfUrl, regeneratedPdfUrl, isLoading }: PDFViewerProps) => {
  // Create proper URL for the PDF viewer
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  // Set up a key to force iframe refresh when URL changes
  const [iframeKey, setIframeKey] = useState(0);
  const [viewerError, setViewerError] = useState(false);
  
  useEffect(() => {
    // Clean up previous blob URL if it exists
    if (blobUrl) {
      revokeBlobUrl(blobUrl);
    }
    
    // Process the current PDF URL (either original or regenerated)
    const currentPdfUrl = regeneratedPdfUrl || pdfUrl;
    
    if (!currentPdfUrl) {
      setBlobUrl(null);
      return;
    }
    
    // Convert to blob URL for better browser compatibility
    try {
      // If it's already a blob URL, use it directly
      if (currentPdfUrl.startsWith('blob:')) {
        setBlobUrl(currentPdfUrl);
      } 
      // If it's a data URI, convert to blob URL
      else if (currentPdfUrl.startsWith('data:')) {
        const newBlobUrl = createBlobUrl(currentPdfUrl);
        setBlobUrl(newBlobUrl);
      }
      // Otherwise, use as is
      else {
        setBlobUrl(currentPdfUrl);
      }
      
      // Reset error state
      setViewerError(false);
    } catch (error) {
      console.error("Error processing PDF URL:", error);
      // Fallback: use original URL directly (may be data: or http(s):)
      setViewerError(false);
      setBlobUrl(currentPdfUrl);
    }
    
  }, [pdfUrl, regeneratedPdfUrl]);
  
  // Refresh iframe when blob URL changes
  useEffect(() => {
    if (blobUrl) {
      setIframeKey(prev => prev + 1);
    }
  }, [blobUrl]);
  
  // Clean up blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        revokeBlobUrl(blobUrl);
      }
    };
  }, [blobUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
        <span className="ml-3 text-shareai-blue">Generating preview...</span>
      </div>
    );
  }

  if (viewerError || (!blobUrl && !regeneratedPdfUrl)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
      </div>
    );
  }
  
  // Render using PDF.js for cross-browser compatibility (works inside iframes)
  return (
      <div className="w-full h-full">
        <PdfJsViewer src={blobUrl || regeneratedPdfUrl || ""} />
      </div>
  );
};

export default PDFViewer;
