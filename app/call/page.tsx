'use client';

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store';
import { useChatStore } from '@/store/chatStore';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Stable component for video stream to prevent jittering
const VideoStream = ({ stream, muted, className, ...props }: { stream: MediaStream | null; muted?: boolean; className?: string;[key: string]: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }

      // Explicitly call play() to ensure audio/video starts even if browser throttles autoPlay
      videoRef.current.play().catch(err => {
        console.warn('[VideoStream] Play intercepted/failed:', err);
      });
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
      {...props}
    />
  );
};

const FALLBACK_ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// Loading fallback for Suspense
function CallLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-[32px] border-4 border-[var(--accent-primary)]/20 animate-ping" />
          <div className="absolute inset-2 rounded-[24px] border-4 border-[var(--accent-primary)]/40 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <p className="text-white/40 text-lg font-bold tracking-widest uppercase">Initializing Secure Call</p>
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

  const localStreamRef = useRef<MediaStream | null>(null);
  const iceConfigRef = useRef<RTCConfiguration>(FALLBACK_ICE_SERVERS);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const offerProcessingRef = useRef<Set<string>>(new Set());
  const makingOfferRef = useRef<Record<string, boolean>>({});

  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [iceReady, setIceReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(isAudioOnly);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenShareUserId, setRemoteScreenShareUserId] = useState<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Get chat data for participant names
  const { chats, fetchChats } = useChatStore();

  // Build a mapping of userId to name
  const participantNames = useMemo(() => {
    const nameMap: Record<string, string> = {};
    const chat = chats.find(c => c.id === chatId);
    if (chat?.users) {
      chat.users.forEach(u => {
        if (u.id && u.name) {
          nameMap[u.id] = u.name;
        }
      });
    }
    return nameMap;
  }, [chats, chatId]);

  // Helper to get display name
  const getDisplayName = useCallback((userId: string) => {
    return participantNames[userId] || `User ${userId.slice(0, 6)}`;
  }, [participantNames]);

  const socket = token ? getSocket(token) : null;

  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      if (!socket) return null;
      if (peersRef.current[targetUserId]) return peersRef.current[targetUserId];

      console.log('[Call] Creating PeerConnection with:', targetUserId);
      const pc = new RTCPeerConnection(iceConfigRef.current);
      peersRef.current[targetUserId] = pc;

      // Ensure stable m-line order: Audio first, Video second
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('video', { direction: 'sendrecv' });

      // Add existing tracks to the transceivers
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          const kind = track.kind;
          const transceiver = pc.getTransceivers().find(t => t.receiver.track.kind === kind);
          if (transceiver && transceiver.sender) {
            transceiver.sender.replaceTrack(track);
          }
        });
      }

      pc.onnegotiationneeded = async () => {
        try {
          if (makingOfferRef.current[targetUserId]) return;
          makingOfferRef.current[targetUserId] = true;

          console.log('[Call] Negotiation needed for:', targetUserId);
          const offer = await pc.createOffer();
          if (pc.signalingState !== 'stable') return;

          await pc.setLocalDescription(offer);
          socket.emit('offer', { chatId, targetUserId, offer });
        } catch (err) {
          console.error('[Call] Error during negotiation:', err);
        } finally {
          makingOfferRef.current[targetUserId] = false;
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        console.log('[Call] Received remote track:', event.track.kind, 'from:', targetUserId, 'StreamID:', remoteStream.id);

        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: remoteStream,
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

      pc.onconnectionstatechange = () => {
        console.log(`[Call] Connection state with ${targetUserId}: ${pc.connectionState}`);
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
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Add tracks if localStream becomes available after peers are created
  useEffect(() => {
    if (localStream) {
      Object.values(peersRef.current).forEach(pc => {
        const senders = pc.getSenders();
        localStream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) {
            if (sender.track !== track) {
              sender.replaceTrack(track);
            }
          } else {
            pc.addTrack(track, localStream);
          }
        });
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (!socket || !chatId) return;

    socket.connect();

    // Fetch TURN servers
    fetch(`${API_URL}/call/ice`)
      .then((res) => res.json())
      .then((iceServers) => {
        console.log('[Call] ICE servers received');
        iceConfigRef.current = { iceServers };
        setIceReady(true);
      })
      .catch((err) => {
        console.warn('Could not fetch TURN servers, using STUN fallback:', err);
        setIceReady(true); // Proceed with fallback
      });

    // Get media based on call type
    const mediaConstraints = {
      audio: true,
      video: !isAudioOnly,
    };

    if (!iceReady) return;

    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
        console.log('[Call] Media acquired, joining call socket');
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
      console.log('[Call] Existing participants:', userIds);
      for (const userId of userIds) {
        // Just creating the PC will trigger onnegotiationneeded because of the transceivers
        createPeerConnection(userId);
      }
    });

    socket.on('userJoinedCall', async (userId: string) => {
      console.log('[Call] User joined:', userId);
      createPeerConnection(userId);
    });

    socket.on('offer', async ({ fromUserId, offer }: { fromUserId: string; offer: any }) => {
      // Prevent duplicate offer processing
      const offerKey = `${fromUserId}-${offer.sdp?.slice(0, 50)}`;
      if (offerProcessingRef.current.has(offerKey)) {
        console.log('[Call] Skipping duplicate offer from:', fromUserId);
        return;
      }
      offerProcessingRef.current.add(offerKey);

      // Clean up old offer keys after 5 seconds
      setTimeout(() => offerProcessingRef.current.delete(offerKey), 5000);

      const pc = createPeerConnection(fromUserId);
      if (!pc) return;

      console.log('[Call] Received offer from:', fromUserId, 'state:', pc.signalingState);

      try {
        // Handle "glare" - when both peers send offers simultaneously
        const isPolite = user?.id && user.id > fromUserId;

        // Check signaling state
        if (pc.signalingState === 'have-remote-offer') {
          // Already have an offer, skip
          console.log('[Call] Already have remote offer, skipping');
          return;
        }

        if (pc.signalingState === 'have-local-offer') {
          if (!isPolite) {
            console.log('[Call] Ignoring offer collision - we are impolite peer');
            return;
          }
          console.log('[Call] Rolling back local offer - we are polite peer');
          await pc.setLocalDescription({ type: 'rollback' });
        }

        // Now we should be in stable state
        if (pc.signalingState !== 'stable') {
          console.warn('[Call] Cannot process offer in state:', pc.signalingState);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
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
      // Clear remote screen share if that user was sharing
      if (remoteScreenShareUserId === userId) {
        setRemoteScreenShareUserId(null);
      }
    });

    // Screen share notifications
    socket.on('screenShareStarted', ({ userId }: { userId: string }) => {
      console.log('[Call] Remote user started screen sharing:', userId);
      setRemoteScreenShareUserId(userId);
    });

    socket.on('screenShareStopped', ({ userId }: { userId: string }) => {
      console.log('[Call] Remote user stopped screen sharing:', userId);
      if (remoteScreenShareUserId === userId) {
        setRemoteScreenShareUserId(null);
      }
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

      // socket.disconnect(); // ❌ REMOVED: This was causing chat connection interruption
    };
  }, [createPeerConnection, socket, chatId, isAudioOnly, user?.id]);

  // Fetch chats to get participant names
  useEffect(() => {
    if (chats.length === 0) {
      fetchChats();
    }
  }, [chats.length, fetchChats]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMutedState = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !newMutedState;
    });
    setIsMuted(newMutedState);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.warn('[Call] No video tracks to toggle');
      return;
    }
    const newCameraOffState = !isCameraOff;
    videoTracks.forEach((track) => {
      track.enabled = !newCameraOffState;
    });
    setIsCameraOff(newCameraOffState);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Restore original video track
      if (originalVideoTrackRef.current) {
        for (const pc of Object.values(peersRef.current)) {
          const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
          if (videoTransceiver && videoTransceiver.sender) {
            try {
              await videoTransceiver.sender.replaceTrack(originalVideoTrackRef.current);
            } catch (err) {
              console.error('[Call] Error restoring camera track:', err);
            }
          }
        }

        if (localStreamRef.current) {
          const stream = localStreamRef.current;
          stream.getVideoTracks().forEach(t => stream.removeTrack(t));
          stream.addTrack(originalVideoTrackRef.current);
          setLocalStream(new MediaStream(stream.getTracks()));
        }
      }

      setIsScreenSharing(false);
      if (socket) {
        socket.emit('screenShareStopped', { chatId });
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' } as MediaTrackConstraints,
          audio: false,
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        if (localStreamRef.current) {
          const originalTrack = localStreamRef.current.getVideoTracks()[0];
          if (originalTrack) {
            originalVideoTrackRef.current = originalTrack;
          }
        }

        for (const pc of Object.values(peersRef.current)) {
          const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
          if (videoTransceiver && videoTransceiver.sender) {
            try {
              await videoTransceiver.sender.replaceTrack(screenTrack);
            } catch (err) {
              console.error('[Call] Error replacing track:', err);
            }
          }
        }

        screenTrack.onended = () => toggleScreenShare();

        setIsScreenSharing(true);
        if (socket) {
          socket.emit('screenShareStarted', { chatId });
        }
      } catch (err: any) {
        console.error('[Call] Screen share error:', err);
        if (err.name !== 'NotAllowedError') {
          setMediaError('Could not share screen: ' + err.message);
        }
      }
    }
  };

  const endCall = () => {
    if (socket) {
      socket.emit('leaveCall', { chatId });
      // socket.disconnect(); // ❌ REMOVED: This was causing chat connection interruption
    }

    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    router.push(chatId ? `/chats/${chatId}` : '/chats');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remoteCount = Object.keys(remoteStreams).length;

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex flex-col font-sans selection:bg-[var(--accent-primary)]/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl flex items-center justify-center shadow-2xl">
            {isAudioOnly ? (
              <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{isAudioOnly ? 'Voice' : 'Video'} Call</h1>
              {!isConnecting && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm font-medium mt-0.5">
              {isConnecting ? 'Establishing connection...' : formatDuration(callDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex -space-x-3 items-center mr-4">
            <div className="w-9 h-9 rounded-full border-2 border-[#0f0f13] bg-[var(--accent-primary)] flex items-center justify-center text-[10px] font-bold shadow-lg shadow-[var(--accent-primary)]/20">
              +{remoteCount + 1}
            </div>
          </div>

          <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {mediaError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-red-500/10 backdrop-blur-2xl border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-red-200/90 font-medium leading-relaxed">{mediaError}</p>
          </div>
        </div>
      )}

      <main className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="w-full h-full max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex-1 min-h-0 relative">
            {remoteCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
                <div className="relative w-full max-w-2xl aspect-video rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-sm group">
                  {isCameraOff || isAudioOnly ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex flex-col items-center justify-center">
                      <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-[var(--accent-primary)] to-[#4f46e5] flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.3)] ring-4 ring-white/10">
                        <span className="text-5xl font-black text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="mt-8 text-white/40 font-semibold tracking-widest uppercase text-xs">Waiting for participants</p>
                    </div>
                  ) : (
                    <VideoStream stream={localStream} muted className="w-full h-full object-cover" />
                  )}

                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-xs font-bold border border-white/10">You</span>
                    {isMuted && (
                      <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center backdrop-blur-md">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn(
                "h-full grid gap-6",
                remoteCount === 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}>
                <ParticipantTile
                  stream={localStream}
                  name="You"
                  isMe
                  isMuted={isMuted}
                  isOff={isCameraOff || isAudioOnly}
                />

                {Object.entries(remoteStreams).map(([userId, stream]) => (
                  <ParticipantTile
                    key={userId}
                    stream={stream}
                    name={getDisplayName(userId)}
                    isScreenShare={remoteScreenShareUserId === userId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-10 flex flex-col items-center">
        <div className="flex items-center gap-4 bg-[#1a1a23]/60 backdrop-blur-3xl px-8 py-5 rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <ControlButton
            onClick={toggleMute}
            active={!isMuted}
            danger={isMuted}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
            label="Mute"
          />

          {!isAudioOnly && (
            <ControlButton
              onClick={toggleCamera}
              active={!isCameraOff}
              danger={isCameraOff}
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
              label="Video"
            />
          )}

          <ControlButton
            onClick={toggleScreenShare}
            active={isScreenSharing}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            label="Share"
            accent={isScreenSharing}
          />

          <div className="w-px h-8 bg-white/10 mx-2" />

          <button
            onClick={endCall}
            className="group w-14 h-14 rounded-2xl bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center shadow-lg shadow-red-500/20 active:scale-90"
            title="End Call"
          >
            <svg className="w-7 h-7 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}

const ControlButton = ({ onClick, active, danger, accent, icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "relative w-14 h-14 rounded-2xl border transition-all flex items-center justify-center group active:scale-90",
      active && !accent ? "bg-white/10 border-white/10 text-white" : "",
      !active && !danger && !accent ? "bg-white/5 border-white/5 text-white/30" : "",
      danger ? "bg-red-500/10 border-red-500/20 text-red-500" : "",
      accent ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/30 text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10" : ""
    )}
    title={label}
  >
    {icon}
    {active && !danger && !accent && (
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1a1a23]" />
    )}
  </button>
);

const ParticipantTile = ({ stream, name, isMe, isMuted, isOff, isScreenShare }: any) => (
  <div className={cn(
    "relative rounded-[28px] overflow-hidden border transition-all duration-300 group aspect-video",
    isMe ? "border-emerald-500/30 bg-white/5" : "border-white/10 bg-white/5",
    isScreenShare ? "ring-2 ring-blue-500 ring-offset-4 ring-offset-[#0f0f13]" : ""
  )}>
    {/* Always render VideoStream so audio keeps playing, but hide it visually if isOff is true */}
    <div className={cn("w-full h-full", isOff && "opacity-0 absolute inset-0 pointer-events-none")}>
      <VideoStream stream={stream} muted={isMe} className="w-full h-full object-cover" />
    </div>

    {isOff && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold">
          {name.charAt(0)}
        </div>
      </div>
    )}

    <div className="absolute bottom-4 left-4 flex items-center gap-2">
      <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-bold border border-white/10 flex items-center gap-2">
        {isScreenShare && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
        {name}
      </div>
      {isMuted && (
        <div className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center backdrop-blur-md">
          <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7" />
          </svg>
        </div>
      )}
    </div>
  </div>
);
