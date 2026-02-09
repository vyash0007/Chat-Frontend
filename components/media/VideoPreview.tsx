'use client';

import React, { useState } from 'react';
import { Lightbox } from './Lightbox';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  src: string;
  className?: string;
  showLightbox?: boolean;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  src,
  className,
  showLightbox = true,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <div className={cn('relative group', className)}>
        <video
          src={src}
          controls={isPlaying}
          className="rounded-md w-full"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Play overlay when not playing */}
        {!isPlaying && (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors rounded-md"
          >
            <div className="bg-[var(--accent-primary)] rounded-full p-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}

        {/* Expand button */}
        {showLightbox && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="View fullscreen"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}

        {/* Duration badge (optional, would need to get video duration) */}
        <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Video
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          mediaUrl={src}
          mediaType="video"
          title="Video"
        />
      )}
    </>
  );
};
