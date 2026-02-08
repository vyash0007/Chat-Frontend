'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageType } from '@/types';
import { useChatStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/constants';

interface MessageInputProps {
  chatId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ chatId }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChatStore();
  const { token } = useAuthStore();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isUploading) return;

    sendMessage({
      chatId,
      content: text.trim(),
      type: MessageType.TEXT,
    });

    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed (${response.status})`);
      }

      const data = await response.json();

      // Determine message type based on file
      let messageType = MessageType.FILE;
      if (file.type.startsWith('image/')) {
        messageType = MessageType.IMAGE;
      } else if (file.type.startsWith('video/')) {
        messageType = MessageType.VIDEO;
      }

      sendMessage({
        chatId,
        content: data.url,
        type: messageType,
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[Upload] File upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      // Clear error after 5 seconds
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t border-[var(--divider-color)] bg-[var(--background-primary)] p-3 sm:p-4">
      {/* Upload error message */}
      {uploadError && (
        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-auto p-1 hover:bg-red-500/20 rounded"
            aria-label="Dismiss error"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex items-end gap-1.5 sm:gap-2">
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 sm:p-2.5 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Upload file"
          title="Upload file"
        >
          <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={isUploading}
            className={cn(
              'w-full resize-none rounded-lg border border-[var(--border-color)] bg-[var(--background-secondary)] px-3 sm:px-4 py-2.5 sm:py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
              'max-h-[120px] overflow-y-auto text-base' // text-base prevents zoom on iOS
            )}
            style={{ minHeight: '44px' }} // Ensure minimum touch target size
          />
        </div>

        {/* Emoji button - hidden on very small screens */}
        <button
          className="hidden xs:flex items-center justify-center p-2 sm:p-2.5 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors flex-shrink-0"
          aria-label="Add emoji"
          title="Emoji"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isUploading}
          className={cn(
            'p-2 sm:p-2.5 rounded-lg transition-colors font-medium flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center',
            text.trim() && !isUploading
              ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]'
              : 'bg-[var(--background-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
          )}
          aria-label="Send message"
          title="Send (Enter)"
        >
          {isUploading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="mt-2 text-xs text-[var(--text-muted)] flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Uploading file...
        </div>
      )}

      {/* Keyboard hints - hidden on mobile */}
      <p className="hidden sm:block mt-2 text-xs text-[var(--text-muted)]">
        Press <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">Enter</kbd> to send,{' '}
        <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
};
