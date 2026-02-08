'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { API_URL } from '@/lib/constants';

type Message = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // ✅ REAL VALUES
  const CHAT_ID = '2611d9c1-6694-4eff-9496-f07602d63731';
  const USER_ID = '402719d4-5fb2-403b-8a88-fa3fc4d15356';
  const ACCESS_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YWJkMzY0OS1lNTAyLTQ0NDUtOGExNC02ZTNlZGZkNzVjZGYiLCJwaG9uZSI6Ijk5OTk5OTk5OTkiLCJpYXQiOjE3NzA1NDc1OTMsImV4cCI6MTc3MTE1MjM5M30.yUmN9po4uQizK959f5L4bBbODbfpM6X1WcLne8RG2bA';

  // 🔹 FETCH MESSAGE HISTORY
  const fetchMessages = async () => {
    try {
      const res = await fetch(
        `${API_URL}/chats/${CHAT_ID}/messages`,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        }
      );

      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('❌ Failed to load messages', err);
    }
  };

  useEffect(() => {
    const socket = getSocket(ACCESS_TOKEN); // 🔒 Pass JWT token

    // 1️⃣ Load old messages first
    fetchMessages();

    // 2️⃣ Connect socket
    socket.connect();

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      console.log('➡️ Joining chat:', CHAT_ID);

      socket.emit('joinChat', { chatId: CHAT_ID });
    });

    // 3️⃣ Listen for new messages
    socket.on('newMessage', (message: Message) => {
      console.log('📩 New message received:', message);
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('newMessage');
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    const socket = getSocket(ACCESS_TOKEN); // 🔒 Pass JWT token

    console.log('📤 Sending message…');

    socket.emit('sendMessage', {
      chatId: CHAT_ID,
      // ❌ senderId removed - taken from JWT on backend
      content: text,
      type: 'TEXT',
    });

    setText('');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat</h2>

      <div
        style={{
          border: '1px solid gray',
          height: 300,
          padding: 10,
          overflowY: 'auto',
          marginBottom: 10,
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.senderId === USER_ID ? 'You' : 'Them'}:</strong>{' '}
            {msg.type === 'IMAGE' ? (
              <img src={msg.content} width={200} alt="image" />
            ) : msg.type === 'VIDEO' ? (
              <video src={msg.content} controls width={200} />
            ) : msg.type === 'FILE' ? (
              <a href={msg.content} target="_blank" rel="noopener noreferrer">
                Download File
              </a>
            ) : (
              <span>{msg.content}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type message"
        style={{ marginRight: 10 }}
      />

      <button onClick={sendMessage}>Send</button>

      <input
        type="file"
        style={{ marginLeft: 10 }}
        onChange={async (e) => {
          if (!e.target.files?.[0]) return;

          const formData = new FormData();
          formData.append('file', e.target.files[0]);

          const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();

          const socket = getSocket(ACCESS_TOKEN);
          socket.emit('sendMessage', {
            chatId: CHAT_ID,
            content: data.url,
            type: data.type, // IMAGE / VIDEO / FILE
          });

          e.target.value = '';
        }}
      />
    </div>
  );
}
