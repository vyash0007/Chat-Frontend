'use client';

import React, { useState, useRef } from 'react';
import { cn, formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = 'image/*,video/*,.pdf,.doc,.docx,.txt',
  maxSize = 100 * 1024 * 1024, // 100MB default
  disabled = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }

    // Check file type if accept is specified
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split('.').pop()}`;

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension.toLowerCase() === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return 'File type not supported';
      }
    }

    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
            : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--background-hover)]',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-[var(--danger)]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {/* Upload Icon */}
        <svg
          className={cn(
            'w-12 h-12 mx-auto mb-4 transition-colors',
            isDragging ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {/* Text */}
        <p className="text-[var(--text-primary)] font-medium mb-1">
          {isDragging ? 'Drop file here' : 'Drag & drop file here'}
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-2">
          or click to browse
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Max file size: {formatFileSize(maxSize)}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-[var(--danger)] flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
