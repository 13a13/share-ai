import React, { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

import { createBlobUrl } from "@/utils/pdfUtils";
// pdf.js imports
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

// Prefer module worker to avoid bundler/iframe issues
try {
  (GlobalWorkerOptions as any).workerPort = new Worker(
    new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
    { type: 'module' }
  );
  // eslint-disable-next-line no-console
  console.log('[PdfJsViewer] Initialized PDF.js module worker');
} catch (err) {
  // Fallback to URL string if module worker is not supported
  // eslint-disable-next-line no-console
  console.warn('[PdfJsViewer] Module worker init failed, falling back to workerSrc', err);
  (GlobalWorkerOptions as any).workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

interface PdfJsViewerProps {
  src: string; // data:, blob:, or http(s) URL
}

const PdfJsViewer: React.FC<PdfJsViewerProps> = ({ src }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Trigger fallback if still loading after a short delay
  useEffect(() => {
    setFallbackActive(false);
    if (!src) return;
    const timer = setTimeout(() => {
      setFallbackActive(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [src]);

  // Compute fallback URL when needed
  useEffect(() => {
    if (!fallbackActive) return;
    let url = src;
    if (src?.startsWith('data:')) {
      try { url = createBlobUrl(src); } catch {}
    }
    setFallbackUrl(url);
    return () => {
      if (url && url.startsWith('blob:') && url !== src) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fallbackActive, src]);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: any = null;

    const loadArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
      // For data: URIs we can fetch directly as arrayBuffer in modern browsers
      try {
        const res = await fetch(url);
        return await res.arrayBuffer();
      } catch {
        // Fallback for older browsers: convert using atob
        if (url.startsWith("data:")) {
          const base64 = url.split("base64,")[1] || url.split(",")[1];
          const binary = atob(base64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
          return bytes.buffer;
        }
        throw new Error("Failed to load PDF data");
      }
    };

    const render = async () => {
      setLoading(true);
      setError(null);
      const container = containerRef.current;
      if (!container) {
        // Container not ready yet (e.g., dialog just opened). Retry shortly.
        setTimeout(() => {
          if (!cancelled) render();
        }, 50);
        return;
      }
      if (!src) {
        setLoading(false);
        setError("No PDF to display");
        return;
      }

      // Cleanup previous
      container.innerHTML = "";

      try {
        let loadingTask: any;
        if (src.startsWith("data:")) {
          const data = await loadArrayBuffer(src);
          loadingTask = getDocument({ data });
        } else if (src.startsWith("blob:")) {
          const data = await loadArrayBuffer(src);
          loadingTask = getDocument({ data });
        } else {
          // http(s)
          loadingTask = getDocument({ url: src, withCredentials: false });
        }

        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        // Render all pages stacked vertically
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) return;

          const viewport = page.getViewport({ scale: 1 });
          const availableWidth = container.clientWidth || 800;
          const scale = Math.min(availableWidth / viewport.width, 2);
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          const ratio = window.devicePixelRatio || 1;
          canvas.width = Math.floor(scaledViewport.width * ratio);
          canvas.height = Math.floor(scaledViewport.height * ratio);
          canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
          canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

          const renderContext = {
            canvasContext: context,
            viewport: scaledViewport,
            transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
          } as any;

          await page.render(renderContext).promise;
          container.appendChild(canvas);

          // Add small gap between pages
          const spacer = document.createElement("div");
          spacer.style.height = "12px";
          container.appendChild(spacer);
        }
      } catch (e: any) {
        console.error("PDF.js render error:", e);
        setError(e?.message || "Failed to render PDF");
      } finally {
        setLoading(false);
      }
    };

    render();

    return () => {
      cancelled = true;
      if (pdfDoc) {
        try { (pdfDoc as any).destroy?.(); } catch {}
      }
    };
  }, [src]);

  if (!src) return null;

  // Timed fallback to native PDF rendering if PDF.js appears stuck
  if (fallbackActive && !error) {
    const url = fallbackUrl || src;
    return (
      <object data={url} type="application/pdf" className="w-full h-full">
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">Unable to display PDF preview in this viewer.</p>
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-shareai-blue hover:underline"
          >
            Open PDF in a new tab
          </a>
        </div>
      </object>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FileText className="h-5 w-5 mr-2 text-gray-400" />
        <span className="text-sm text-gray-500">Loading PDF preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-500 mb-2">{error}</p>
        <a 
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-shareai-blue hover:underline"
        >
          Open PDF in a new tab
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto bg-white" />
  );
};

export default PdfJsViewer;
