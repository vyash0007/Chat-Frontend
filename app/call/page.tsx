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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-purple-400/50 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <p className="text-white/70 text-lg font-medium">Connecting to call...</p>
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
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { chatId, targetUserId: userId, offer });
        } catch (err) {
          console.error('[Call] Error creating offer:', err);
        }
      }
    });

    socket.on('userJoinedCall', async (userId: string) => {
      createPeerConnection(userId);
    });

    socket.on('offer', async ({ fromUserId, offer }: { fromUserId: string; offer: any }) => {
      const pc = createPeerConnection(fromUserId);
      if (!pc) return;

      console.log('[Call] Received offer from:', fromUserId, 'state:', pc.signalingState);

      try {
        // Handle "glare" - when both peers send offers simultaneously
        // Use lexicographic comparison of user IDs to consistently determine roles
        const isPolite = user?.id && user.id > fromUserId;

        // Check if we're not in a state to accept an offer
        if (pc.signalingState !== 'stable') {
          if (!isPolite) {
            // We're impolite - ignore the incoming offer, our offer takes precedence
            console.log('[Call] Ignoring offer collision - we are impolite peer');
            return;
          }
          // We're polite - need to rollback our offer first
          console.log('[Call] Rolling back local offer - we are polite peer');
          await Promise.all([
            pc.setLocalDescription({ type: 'rollback' }),
            pc.setRemoteDescription(offer)
          ]);
        } else {
          // Normal case - stable state, just set remote description
          await pc.setRemoteDescription(offer);
        }

        // Now we should be in have-remote-offer state
        if (pc.signalingState !== 'have-remote-offer') {
          console.error('[Call] Unexpected state after setRemoteDescription:', pc.signalingState);
          return;
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { chatId, targetUserId: fromUserId, answer });
        console.log('[Call] Sent answer to:', fromUserId);
      } catch (err) {
        console.error('[Call] Error handling offer:', err);
      }
    });

    socket.on('answer', async ({ fromUserId, answer }: { fromUserId: string; answer: any }) => {
      const pc = peersRef.current[fromUserId];
      if (!pc) return;

      try {
        // Only set remote description if we're waiting for an answer
        if (pc.signalingState !== 'have-local-offer') {
          console.warn('[Call] Ignoring answer - not waiting for answer:', pc.signalingState);
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex flex-col">
      {/* Header with glassmorphism */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl ${isConnecting
              ? 'bg-amber-500/20'
              : 'bg-emerald-500/20'
              }`}>
              {isAudioOnly ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${isConnecting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`} />
            </div>
            <div>
              <h1 className="text-white font-semibold">
                {isAudioOnly ? 'Voice Call' : 'Video Call'}
              </h1>
              <p className="text-white/50 text-sm">
                {isConnecting ? 'Connecting...' : formatDuration(callDuration)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
            <span className="text-white/70 text-sm">
              {remoteCount + 1} participant{remoteCount !== 0 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {mediaError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl text-red-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Permission Error</p>
              <p className="text-sm mt-1 text-red-200/80">{mediaError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Video Grid */}
      <main className="flex-1 p-6 overflow-auto">
        <div className={`grid gap-4 h-full ${remoteCount === 0 ? 'grid-cols-1' :
          remoteCount === 1 ? 'grid-cols-1 lg:grid-cols-2' :
            'grid-cols-2 lg:grid-cols-3'
          }`}>
          {/* Local Video */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 min-h-[300px] group">
            {isAudioOnly || isCameraOff ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-xl opacity-50" />
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
                    <span className="text-4xl text-white font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'Y'}
                    </span>
                  </div>
                </div>
                {isCameraOff && !isAudioOnly && (
                  <p className="mt-4 text-white/50 text-sm">Camera off</p>
                )}
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

            {/* Label */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-white text-sm font-medium">You</span>
              </div>
              {isMuted && (
                <div className="p-2 bg-red-500/80 backdrop-blur-sm rounded-xl">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([userId, stream]) => (
            <div key={userId} className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 min-h-[300px]">
              <video
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
              />
              <div className="absolute bottom-4 left-4">
                <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                  <span className="text-white text-sm font-medium">User {userId.slice(0, 6)}...</span>
                </div>
              </div>
            </div>
          ))}

          {/* Waiting State */}
          {remoteCount === 0 && (
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-2 rounded-full bg-purple-500/30 animate-ping" style={{ animationDuration: '2.5s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-white/60 text-lg font-medium">Waiting for others to join...</p>
                <p className="text-white/40 text-sm mt-2">Share this call to invite participants</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Control Bar with glassmorphism */}
      <footer className="px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4 p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`group relative p-4 rounded-2xl transition-all duration-300 ${isMuted
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
                : 'bg-white/10 text-white hover:bg-white/20'
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
                className={`group relative p-4 rounded-2xl transition-all duration-300 ${isCameraOff
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
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

            {/* Screen Share Button (placeholder) */}
            <button
              className="group relative p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
              title="Share screen (coming soon)"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="p-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
              title="End call"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
