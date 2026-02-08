'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  title?: string;
}

export const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  title,
}) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] bg-black bg-opacity-95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
        <h3 className="text-white font-medium truncate max-w-md">
          {title || 'Media Viewer'}
        </h3>

        <div className="flex items-center gap-2">
          {/* Zoom controls (only for images) */}
          {mediaType === 'image' && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                aria-label="Zoom out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomReset();
                }}
                className="px-3 py-1 text-sm text-white hover:bg-white/10 rounded transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                aria-label="Zoom in"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
            </div>
          )}

          {/* Download button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            aria-label="Download"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Media Content */}
      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={title || 'Media'}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-full"
          />
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm text-center">
        <p>Press <kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd> to close</p>
      </div>
    </div>
  );
};
