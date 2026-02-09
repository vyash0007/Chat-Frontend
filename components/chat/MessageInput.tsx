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

      // Send the file URL as a message
      sendMessage({
        chatId,
        content: data.url,
        type: messageType,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-2 md:p-4 md:pt-1">
      {/* Upload Error */}
      {uploadError && (
        <div className="mb-2 md:mb-3 p-2 md:p-3 bg-red-50 border border-red-200 rounded-xl text-xs md:text-sm text-red-600">
          {uploadError}
        </div>
      )}

      {/* Input Container */}
      <div className="flex items-center bg-[var(--background-secondary)] rounded-sm px-1 md:px-2 py-1.5 md:py-2 border border-[var(--border-color)] focus-within:border-[var(--accent-primary)]/30 transition-colors">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-1.5 md:p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-50 flex-shrink-0"
          aria-label="Attach file"
        >
          <svg className="w-5 h-5 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Your message"
          disabled={isUploading}
          rows={1}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 px-1.5 md:px-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none max-h-[120px] min-w-0"
          style={{ lineHeight: '1.5' }}
        />

        {/* Voice Button */}
        <button
          className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Voice message"
        >
          <svg className="w-5 h-5 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
          </svg>
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isUploading}
          className={cn(
            "p-1.5 md:p-2 rounded-md transition-colors flex-shrink-0",
            text.trim() && !isUploading
              ? "bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-soft)]"
              : "text-[var(--text-muted)]"
          )}
          aria-label="Send message"
        >
          <svg className="w-5 h-5 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
};
