"use client";

import { useState, useEffect } from "react";
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
  const [viewerUrl, setViewerUrl] = useState("");

  // Use Google Docs Viewer as a proxy to bypass X-Frame-Options
  useEffect(() => {
    const encodedUrl = encodeURIComponent(pdfUrl);
    setViewerUrl(`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`);
  }, [pdfUrl]);

  const handleDownload = () => {
    window.open(pdfUrl, "_blank");
  };

  const handleViewInNewTab = () => {
    window.open(pdfUrl, "_blank");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 dark:bg-black flex flex-col">
        <div className="bg-gray-800 dark:bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold">{chapterName}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewInNewTab}
              className="text-white hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-gray-700"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
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
                  The PDF may not be available or there was an error loading it.
                </p>
                <div className="flex gap-2 justify-center">
                <Button onClick={handleViewInNewTab} variant="outline" className="text-white border-white hover:bg-gray-800">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button onClick={handleDownload} variant="outline" className="text-white border-white hover:bg-gray-800">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              </div>
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={chapterName}
              onLoad={handleLoad}
              onError={handleError}
              allow="fullscreen"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
          {chapterName}
        </h3>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewInNewTab}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Open</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="relative" style={{ minHeight: "600px", height: "70vh" }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading PDF...</p>
            </div>
          </div>
        )}
        {hasError ? (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-8">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Unable to load PDF
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                The PDF may not be available or there was an error loading it.
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
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={chapterName}
            onLoad={handleLoad}
            onError={handleError}
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
}

