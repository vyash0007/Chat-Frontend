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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'IMAGE' | 'VIDEO' | 'FILE' | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clean up blob URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine best supported mime type
      // On Mac/iOS (Safari), audio/mp4 is much more reliable than webm
      const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

      const mimeType = (isApple && MediaRecorder.isTypeSupported('audio/mp4'))
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
              ? 'audio/mp4'
              : 'audio/ogg';

      console.log('[Media] Recording with mimeType:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await uploadVoiceMessage(audioBlob, mimeType);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setUploadError(null);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setUploadError('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const uploadVoiceMessage = async (blob: Blob, mimeType: string) => {
    setIsUploading(true);
    setUploadError(null);
    setPreviewUrl('voice');
    setPreviewType('FILE');

    try {
      const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('webm') ? 'webm' : 'ogg';
      const file = new File([blob], `voice-message-${Date.now()}.${extension}`, { type: mimeType });
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

      if (!response.ok) throw new Error('Voice upload failed');

      const data = await response.json();
      sendMessage({ chatId, content: data.url, type: MessageType.AUDIO });
      setPreviewUrl(null);
      setPreviewType(null);
    } catch (error) {
      setUploadError('Failed to send voice message');
      setPreviewUrl(null);
      setPreviewType(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = () => {
    if (!text.trim() || isUploading) return;
    sendMessage({ chatId, content: text.trim(), type: MessageType.TEXT });
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

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    let type: 'IMAGE' | 'VIDEO' | 'FILE' = 'FILE';
    if (file.type.startsWith('image/')) type = 'IMAGE';
    else if (file.type.startsWith('video/')) type = 'VIDEO';
    setPreviewType(type);

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/upload`, { method: 'POST', headers, body: formData });
      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      sendMessage({ chatId, content: data.url, type: (type === 'IMAGE' ? MessageType.IMAGE : type === 'VIDEO' ? MessageType.VIDEO : MessageType.FILE) });
      setPreviewUrl(null);
      setPreviewType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setUploadError('Upload failed');
      setPreviewUrl(null);
      setPreviewType(null);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-2 md:p-4 md:pt-1">
      {uploadError && (
        <div className="mb-2 md:mb-3 p-2 md:p-3 bg-red-50 border border-red-200 rounded-xl text-xs md:text-sm text-red-600">
          {uploadError}
        </div>
      )}

      {previewUrl && (
        <div className="mb-2 relative inline-block group">
          <div className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--background-secondary)]">
            {previewType === 'IMAGE' ? (
              <img src={previewUrl} alt="Preview" className="max-h-40 object-contain" />
            ) : previewType === 'VIDEO' ? (
              <video src={previewUrl} className="max-h-40" />
            ) : (
              <div className="p-4 flex items-center gap-2">
                <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">{previewUrl === 'voice' ? 'Sending voice message...' : 'Uploading...'}</span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {!isUploading && (
            <button onClick={cancelUpload} className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--danger)] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
      )}

      <div className="flex items-center bg-[var(--background-secondary)] rounded-sm px-1 md:px-2 py-1.5 md:py-2 border border-[var(--border-color)] focus-within:border-[var(--accent-primary)]/30 transition-colors">
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-2 py-1 bg-red-500/10 rounded-md">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-500">Recording... {formatDuration(recordingDuration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={cancelRecording} className="px-3 py-1 text-xs font-bold text-red-500 hover:bg-red-500/20 rounded-md transition-colors">CANCEL</button>
              <button onClick={stopRecording} className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-1.5 md:p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-50 flex-shrink-0">
              <svg className="w-5 h-5 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            </button>
            <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Your message" disabled={isUploading} rows={1} className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 px-1.5 md:px-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none max-h-[120px] min-w-0" style={{ lineHeight: '1.5' }} />
            <button onClick={startRecording} disabled={isUploading || text.trim().length > 0} className={cn("p-1.5 md:p-2 transition-colors flex-shrink-0", (isUploading || text.trim().length > 0) ? "text-gray-400 opacity-50" : "text-[var(--accent-primary)] hover:bg-[var(--accent-soft)] rounded-md")}>
              <svg className="w-5 h-5 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" /></svg>
            </button>
            <button onClick={handleSend} disabled={!text.trim() || isUploading} className={cn("p-1.5 md:p-2 rounded-md transition-colors flex-shrink-0", text.trim() && !isUploading ? "bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-soft)]" : "text-[var(--text-muted)]")}>
              <svg className="w-5 h-5 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
    </div>
  );
};
