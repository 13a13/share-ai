import React, { useEffect, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import { createBlobUrl, revokeBlobUrl, isIosDevice } from "@/utils/pdfUtils";

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
      setViewerError(true);
      setBlobUrl(null);
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
        <p className="text-gray-500">{viewerError ? "Error displaying PDF preview" : "No preview available"}</p>
        {viewerError && isIosDevice() && (
          <p className="text-sm text-gray-400 mt-2">
            iOS may have limitations displaying large PDFs. Try downloading the file instead.
          </p>
        )}
      </div>
    );
  }
  
  // For iOS devices, offer an option to open in a new tab
  if (isIosDevice()) {
    return (
      <div className="flex flex-col h-full">
        <iframe 
          key={iframeKey}
          src={blobUrl || ""}
          className="w-full h-full"
          title="PDF Preview"
          onError={() => setViewerError(true)}
        />
        {blobUrl && (
          <div className="text-center p-2 bg-gray-100 border-t">
            <button 
              onClick={() => window.open(blobUrl, '_blank')}
              className="text-sm text-shareai-blue hover:underline"
            >
              Open PDF in new tab for better viewing on iOS
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Regular preview for non-iOS devices
  return (
    <iframe 
      key={iframeKey}
      src={blobUrl || ""}
      className="w-full h-full"
      title="PDF Preview"
      onError={() => setViewerError(true)}
    />
  );
};

export default PDFViewer;
