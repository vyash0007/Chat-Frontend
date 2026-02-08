'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageType } from '@/types';
import { useChatStore } from '@/store';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  chatId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ chatId }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChatStore();

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

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
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
      console.error('File upload failed:', error);
      // TODO: Show error toast
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t border-[var(--divider-color)] bg-[var(--background-primary)] p-4">
      <div className="flex items-end gap-2">
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Upload file"
          title="Upload file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={isUploading}
            className={cn(
              'w-full resize-none rounded-lg border border-[var(--border-color)] bg-[var(--background-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
              'max-h-[120px] overflow-y-auto'
            )}
            style={{ minHeight: '44px' }}
          />
        </div>

        {/* Emoji button */}
        <button
          className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
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
            'p-2 rounded-lg transition-colors font-medium',
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
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

      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Press <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">Enter</kbd> to send,{' '}
        <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
};
