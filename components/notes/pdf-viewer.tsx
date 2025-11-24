"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Maximize2, Minimize2, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string;
  chapterName: string;
  className?: string;
}

export default function PDFViewer({ pdfUrl, chapterName, className = "" }: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");
  const objectRef = useRef<HTMLObjectElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate proxy URL when PDF URL changes
  useEffect(() => {
    if (pdfUrl) {
      const encodedUrl = encodeURIComponent(pdfUrl);
      setProxyUrl(`/api/pdf-proxy?url=${encodedUrl}`);
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
    }
  }, [pdfUrl]);

  // Handle load events
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle errors - try iframe if object fails
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage("Unable to load PDF. Try opening it in a new tab.");
  };

  const handleDownload = () => {
    window.open(proxyUrl || pdfUrl, "_blank");
  };

  const handleViewInNewTab = () => {
    window.open(proxyUrl || pdfUrl, "_blank");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render controls
  const renderControls = (isFullscreenMode: boolean = false) => (
    <div
      className={`${
        isFullscreenMode ? "bg-gray-800 dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-900"
      } border-b ${
        isFullscreenMode ? "border-gray-700" : "border-gray-200 dark:border-gray-700"
      } px-4 py-3 flex items-center justify-between flex-wrap gap-2`}
    >
      <h3
        className={`text-lg font-semibold ${
          isFullscreenMode ? "text-white" : "text-gray-900 dark:text-white"
        } truncate flex-1`}
      >
        {chapterName}
      </h3>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewInNewTab}
          className={
            isFullscreenMode
              ? "text-white hover:bg-gray-700"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Open</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className={
            isFullscreenMode
              ? "text-white hover:bg-gray-700"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }
        >
          <Download className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Download</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className={
            isFullscreenMode
              ? "text-white hover:bg-gray-700"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }
        >
          {isFullscreenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  // Render PDF viewer
  const renderPDFViewer = () => {
    if (!proxyUrl) return null;

    return (
      <object
        key={proxyUrl}
        ref={objectRef}
        data={proxyUrl}
        type="application/pdf"
        className="w-full h-full"
        onLoad={handleLoad}
        onError={handleError}
        style={{ minHeight: "600px" }}
      >
        {/* Fallback to iframe if object tag doesn't work */}
        <iframe
          key={`${proxyUrl}-iframe`}
          ref={iframeRef}
          src={proxyUrl}
          className="w-full h-full border-0"
          title={chapterName}
          onLoad={handleLoad}
          onError={handleError}
          allow="fullscreen"
          style={{ minHeight: "600px" }}
        />
      </object>
    );
  };

  // Fullscreen view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 dark:bg-black flex flex-col">
        {renderControls(true)}
        <div className="flex-1 overflow-hidden bg-gray-800 dark:bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-white">Loading PDF...</p>
              </div>
            </div>
          )}
          {hasError ? (
            <div className="h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-white p-8">
                <p className="text-lg mb-4">Unable to load PDF</p>
                <p className="text-sm text-gray-400 mb-4">
                  {errorMessage || "The PDF may not be available or there was an error loading it."}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleViewInNewTab}
                    variant="outline"
                    className="text-white border-white hover:bg-gray-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="text-white border-white hover:bg-gray-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full w-full">{renderPDFViewer()}</div>
          )}
        </div>
      </div>
    );
  }

  // Normal view
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {renderControls(false)}
      <div className="relative overflow-auto bg-gray-100 dark:bg-gray-900" style={{ minHeight: "600px", height: "70vh" }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading PDF...</p>
            </div>
          </div>
        )}
        {hasError ? (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-8">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unable to load PDF</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {errorMessage || "The PDF may not be available or there was an error loading it."}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleViewInNewTab} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        ) : (
          renderPDFViewer()
        )}
      </div>
    </div>
  );
}
