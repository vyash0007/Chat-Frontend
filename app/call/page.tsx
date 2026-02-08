'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store';
import { API_URL } from '@/lib/constants';

const FALLBACK_ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// Loading fallback for Suspense
function CallLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-gray-400">Loading call...</p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
export default function CallPage() {
  return (
    <Suspense fallback={<CallLoading />}>
      <CallContent />
    </Suspense>
  );
}

function CallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, user } = useAuthStore();

  const chatId = searchParams.get('chatId') || '';
  const isAudioOnly = searchParams.get('audio') === 'true';

  const localVideo = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceConfigRef = useRef<RTCConfiguration>(FALLBACK_ICE_SERVERS);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(isAudioOnly);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const socket = token ? getSocket(token) : null;

  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      if (!socket) return null;
      if (peersRef.current[targetUserId]) return peersRef.current[targetUserId];

      const pc = new RTCPeerConnection(iceConfigRef.current);
      peersRef.current[targetUserId] = pc;

      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: event.streams[0],
        }));
        setIsConnecting(false);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('iceCandidate', {
            chatId,
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      return pc;
    },
    [socket, chatId],
  );

  // Call duration timer
  useEffect(() => {
    if (isConnecting) return;
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnecting]);

  // Handle browser tab close/navigate to ensure media is released
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Stop all media tracks when page is about to unload
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!socket || !chatId) return;

    socket.connect();

    // Fetch TURN servers
    fetch(`${API_URL}/call/ice`)
      .then((res) => res.json())
      .then((iceServers) => {
        iceConfigRef.current = { iceServers };
      })
      .catch((err) => {
        console.warn('Could not fetch TURN servers, using STUN fallback:', err);
      });

    // Get media based on call type
    const mediaConstraints = {
      audio: true,
      video: !isAudioOnly,
    };

    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;
        socket.emit('joinCall', { chatId });
      })
      .catch((err) => {
        console.error('Camera/mic error:', err);
        if (err.name === 'NotAllowedError') {
          setMediaError(
            'Camera/microphone blocked. Please enable permissions in your browser settings.',
          );
        } else {
          setMediaError(`Could not access camera/mic: ${err.message}`);
        }
      });

    socket.on('existingParticipants', async (userIds: string[]) => {
      for (const userId of userIds) {
        const pc = createPeerConnection(userId);
        if (!pc) continue;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { chatId, targetUserId: userId, offer });
      }
    });

    socket.on('userJoinedCall', async (userId: string) => {
      createPeerConnection(userId);
    });

    socket.on('offer', async ({ fromUserId, offer }: { fromUserId: string; offer: any }) => {
      const pc = createPeerConnection(fromUserId);
      if (!pc) return;

      // Only process offer if we're in a stable state
      if (pc.signalingState !== 'stable') {
        console.warn('[Call] Ignoring offer - connection not in stable state:', pc.signalingState);
        return;
      }

      try {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { chatId, targetUserId: fromUserId, answer });
      } catch (err) {
        console.error('[Call] Error handling offer:', err);
      }
    });

    socket.on('answer', async ({ fromUserId, answer }: { fromUserId: string; answer: any }) => {
      const pc = peersRef.current[fromUserId];
      if (!pc) return;

      // Only set remote description if we're waiting for an answer
      if (pc.signalingState !== 'have-local-offer') {
        console.warn('[Call] Ignoring answer - not waiting for answer:', pc.signalingState);
        return;
      }

      try {
        await pc.setRemoteDescription(answer);
      } catch (err) {
        console.error('[Call] Error handling answer:', err);
      }
    });

    socket.on('iceCandidate', ({ fromUserId, candidate }: { fromUserId: string; candidate: any }) => {
      const pc = peersRef.current[fromUserId];
      if (pc) pc.addIceCandidate(candidate);
    });

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
      // Cleanup on unmount - ensure camera/mic are released
      console.log('[Call] Cleaning up call resources...');

      // Close all peer connections
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};

      // Stop all media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`[Call] Cleanup: Stopped ${track.kind} track`);
        });
        localStreamRef.current = null;
      }

      socket.disconnect();
    };
  }, [createPeerConnection, socket, chatId, isAudioOnly]);

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
    // Notify server we're leaving
    if (socket) {
      socket.emit('leaveCall', { chatId });
      socket.disconnect();
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};

    // Stop all media tracks to release camera/mic
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`[Call] Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }

    // Clear video element
    if (localVideo.current) {
      localVideo.current.srcObject = null;
    }

    // Navigate back to chat
    router.push(chatId ? `/chats/${chatId}` : '/chats');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remoteCount = Object.keys(remoteStreams).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-white font-medium">
            {isAudioOnly ? 'Voice Call' : 'Video Call'}
          </span>
          {!isConnecting && (
            <span className="text-gray-400 text-sm ml-2">{formatDuration(callDuration)}</span>
          )}
        </div>
        <span className="text-gray-400 text-sm">
          {remoteCount} participant{remoteCount !== 1 ? 's' : ''} connected
        </span>
      </header>

      {/* Error Message */}
      {mediaError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          <p className="font-medium">Permission Error</p>
          <p className="text-sm mt-1">{mediaError}</p>
        </div>
      )}

      {/* Main Video Grid */}
      <main className="flex-1 p-6 overflow-auto">
        <div className={`grid gap-4 h-full ${remoteCount === 0 ? 'grid-cols-1' :
          remoteCount === 1 ? 'grid-cols-2' :
            'grid-cols-2 lg:grid-cols-3'
          }`}>
          {/* Local Video */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-800 min-h-[200px]">
            {isAudioOnly || isCameraOff ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'Y'}
                  </span>
                </div>
              </div>
            ) : (
              <video
                ref={localVideo}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg">
              <span className="text-white text-sm font-medium">You</span>
            </div>
            {isMuted && (
              <div className="absolute top-3 right-3 p-2 bg-red-500/80 rounded-full">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([userId, stream]) => (
            <div key={userId} className="relative rounded-2xl overflow-hidden bg-gray-800 min-h-[200px]">
              <video
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
              />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg">
                <span className="text-white text-sm font-medium">User {userId.slice(0, 8)}</span>
              </div>
            </div>
          ))}

          {/* Waiting State */}
          {remoteCount === 0 && (
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-400">Waiting for others to join...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Control Bar */}
      <footer className="px-6 py-6 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${isMuted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Camera Button (only for video calls) */}
          {!isAudioOnly && (
            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all ${isCameraOff
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isCameraOff ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
            title="End call"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
