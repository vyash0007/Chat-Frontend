'use client';

import React, { useState } from 'react';
import { Lightbox } from './Lightbox';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
  showLightbox?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = 'Image',
  className,
  showLightbox = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (hasError) {
    return (
      <div className={cn('flex items-center justify-center bg-[var(--background-tertiary)] rounded-lg p-4', className)}>
        <div className="text-center">
          <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative group', className)}>
        {/* Loading Skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-[var(--background-tertiary)] animate-pulse rounded-lg" />
        )}

        {/* Image */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          onClick={() => showLightbox && setLightboxOpen(true)}
          className={cn(
            'rounded-lg transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            showLightbox && 'cursor-pointer hover:opacity-90'
          )}
        />

        {/* Hover overlay with expand icon */}
        {showLightbox && isLoaded && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-black/50 rounded-full p-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          mediaUrl={src}
          mediaType="image"
          title={alt}
        />
      )}
    </>
  );
};
