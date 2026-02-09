'use client';

import React from 'react';
import { cn, formatFileSize } from '@/lib/utils';

interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
  onCancel?: () => void;
  status?: 'uploading' | 'success' | 'error';
  error?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  fileSize,
  progress,
  onCancel,
  status = 'uploading',
  error,
}) => {
  return (
    <div className="bg-[var(--background-secondary)] rounded-md p-4 border border-[var(--border-color)]">
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center',
          status === 'uploading' && 'bg-[var(--accent-primary)]/10',
          status === 'success' && 'bg-[var(--success)]/10',
          status === 'error' && 'bg-[var(--danger)]/10'
        )}>
          {status === 'uploading' && (
            <svg className="w-5 h-5 text-[var(--accent-primary)] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {status === 'success' && (
            <svg className="w-5 h-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'error' && (
            <svg className="w-5 h-5 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {fileName}
            </p>
            {onCancel && status === 'uploading' && (
              <button
                onClick={onCancel}
                className="flex-shrink-0 p-1 rounded hover:bg-[var(--background-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Cancel upload"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress or Status */}
          {status === 'uploading' && (
            <>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
                <span>{formatFileSize(fileSize)}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}

          {status === 'success' && (
            <p className="text-xs text-[var(--success)]">
              Upload complete • {formatFileSize(fileSize)}
            </p>
          )}

          {status === 'error' && (
            <p className="text-xs text-[var(--danger)]">
              {error || 'Upload failed'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
