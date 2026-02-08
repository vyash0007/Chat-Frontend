'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { InviteModal } from '@/components/chat/InviteModal';
import { InvitationType } from '@/types';
import { API_URL } from '@/lib/constants';

const FALLBACK_ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function CallPage() {
  const localVideo = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceConfigRef = useRef<RTCConfiguration>(FALLBACK_ICE_SERVERS);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const CHAT_ID = 'PASTE_CHAT_ID';
  const ACCESS_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YWJkMzY0OS1lNTAyLTQ0NDUtOGExNC02ZTNlZGZkNzVjZGYiLCJwaG9uZSI6Ijk5OTk5OTk5OTkiLCJpYXQiOjE3NzA1NDc1OTMsImV4cCI6MTc3MTE1MjM5M30.yUmN9po4uQizK959f5L4bBbODbfpM6X1WcLne8RG2bA';
  const socket = getSocket(ACCESS_TOKEN);

  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      if (peersRef.current[targetUserId]) return peersRef.current[targetUserId];

      const pc = new RTCPeerConnection(iceConfigRef.current);
      peersRef.current[targetUserId] = pc;

      // Add local tracks to the connection
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      // When we receive remote tracks, store the stream
      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: event.streams[0],
        }));
      };

      // Forward ICE candidates to the specific target user
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('iceCandidate', {
            chatId: CHAT_ID,
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      return pc;
    },
    [socket],
  );

  useEffect(() => {
    socket.connect();

    // Fetch TURN servers from backend, fall back to STUN-only
    fetch(`${API_URL}/call/ice`)
      .then((res) => res.json())
      .then((iceServers) => {
        iceConfigRef.current = { iceServers };
      })
      .catch((err) => {
        console.warn('Could not fetch TURN servers, using STUN fallback:', err);
      });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;

        // Join the call room after media is ready
        socket.emit('joinCall', { chatId: CHAT_ID });
      })
      .catch((err) => {
        console.error('Camera/mic error:', err);
        if (err.name === 'NotAllowedError') {
          setMediaError(
            'Camera/microphone blocked by your system. Go to macOS System Settings → Privacy & Security → Camera (and Microphone) → enable your browser, then restart the browser.',
          );
        } else {
          setMediaError(`Could not access camera/mic: ${err.message}`);
        }
      });

    // When we join, server tells us who is already in the call
    socket.on('existingParticipants', async (userIds: string[]) => {
      for (const userId of userIds) {
        const pc = createPeerConnection(userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { chatId: CHAT_ID, targetUserId: userId, offer });
      }
    });

    // When a new user joins after us
    socket.on('userJoinedCall', async (userId: string) => {
      // The new user will send us an offer, so just prepare
      createPeerConnection(userId);
    });

    // Receive an offer from another user
    socket.on(
      'offer',
      async ({ fromUserId, offer }: { fromUserId: string; offer: any }) => {
        const pc = createPeerConnection(fromUserId);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', {
          chatId: CHAT_ID,
          targetUserId: fromUserId,
          answer,
        });
      },
    );

    // Receive an answer
    socket.on(
      'answer',
      async ({ fromUserId, answer }: { fromUserId: string; answer: any }) => {
        const pc = peersRef.current[fromUserId];
        if (pc) await pc.setRemoteDescription(answer);
      },
    );

    // Receive ICE candidate
    socket.on(
      'iceCandidate',
      ({
        fromUserId,
        candidate,
      }: {
        fromUserId: string;
        candidate: any;
      }) => {
        const pc = peersRef.current[fromUserId];
        if (pc) pc.addIceCandidate(candidate);
      },
    );

    // User left the call
    socket.on('userLeftCall', (userId: string) => {
      const pc = peersRef.current[userId];
      if (pc) {
        pc.close();
        delete peersRef.current[userId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      socket.disconnect();
    };
  }, [createPeerConnection, socket]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsCameraOff(!track.enabled);
    });
  };

  const endCall = () => {
    socket.emit('leaveCall', { chatId: CHAT_ID });
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    socket.disconnect();
    window.location.href = '/chat';
  };

  return (
    <div>
      <h2>Video Call</h2>

      {mediaError && (
        <div style={{ color: 'red', marginBottom: 10, maxWidth: 500 }}>
          <strong>Permission Error:</strong> {mediaError}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p>You</p>
          <video ref={localVideo} autoPlay muted width={300} />
        </div>

        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <div key={userId}>
            <p>User {userId.slice(0, 8)}...</p>
            <video
              autoPlay
              width={300}
              ref={(el) => {
                if (el) el.srcObject = stream;
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={toggleMute}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>

        <button onClick={toggleCamera}>
          {isCameraOff ? 'Camera On' : 'Camera Off'}
        </button>

        <button onClick={() => setShowInviteModal(true)} style={{ marginLeft: 10 }}>
          Invite to Call
        </button>

        <button onClick={endCall} style={{ color: 'red', marginLeft: 10 }}>
          End Call
        </button>
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        chatId={CHAT_ID}
        chatName="Call Session"
        defaultType={InvitationType.TEMPORARY_CALL}
      />
    </div>
  );
}
