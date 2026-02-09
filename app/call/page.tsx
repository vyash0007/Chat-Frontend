'use client';

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store';
import { useChatStore } from '@/store/chatStore';
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenShareUserId, setRemoteScreenShareUserId] = useState<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const offerProcessingRef = useRef<Set<string>>(new Set());

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

      socket.disconnect();
    };
  }, [createPeerConnection, socket, chatId, isAudioOnly]);

  // Bind screen stream to video element when screen sharing starts
  useEffect(() => {
    if (isScreenSharing && screenStreamRef.current && screenVideoRef.current) {
      console.log('[Call] Binding screen stream to video element');
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [isScreenSharing]);

  // Fetch chats to get participant names
  useEffect(() => {
    if (chats.length === 0) {
      fetchChats();
    }
  }, [chats.length, fetchChats]);

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

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing - restore camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Restore original video track
      if (originalVideoTrackRef.current) {
        for (const pc of Object.values(peersRef.current)) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video' || !s.track);
          if (sender) {
            try {
              await sender.replaceTrack(originalVideoTrackRef.current);
              console.log('[Call] Restored camera track in peer connection');
            } catch (err) {
              console.error('[Call] Error restoring camera track:', err);
            }
          }
        }

        if (localStreamRef.current) {
          const stream = localStreamRef.current;
          stream.getVideoTracks().forEach(t => stream.removeTrack(t));
          stream.addTrack(originalVideoTrackRef.current);
          if (localVideo.current) {
            localVideo.current.srcObject = stream;
          }
        }
      }

      setIsScreenSharing(false);
      // Notify others that screen sharing stopped
      if (socket) {
        socket.emit('screenShareStopped', { chatId });
      }
      console.log('[Call] Screen sharing stopped');
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          } as MediaTrackConstraints,
          audio: false,
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        console.log('[Call] Got screen track:', screenTrack.label);

        // Save original video track
        if (localStreamRef.current) {
          const originalTrack = localStreamRef.current.getVideoTracks()[0];
          if (originalTrack) {
            originalVideoTrackRef.current = originalTrack;
            console.log('[Call] Saved original camera track');
          }
        }

        // Replace video track in all peer connections
        for (const [userId, pc] of Object.entries(peersRef.current)) {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) {
            try {
              await videoSender.replaceTrack(screenTrack);
              console.log('[Call] Replaced video track for peer:', userId);
            } catch (err) {
              console.error('[Call] Error replacing track for peer:', userId, err);
            }
          } else {
            console.warn('[Call] No video sender found for peer:', userId);
          }
        }

        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          console.log('[Call] Screen track ended via browser UI');
          toggleScreenShare();
        };

        // Set state first - the useEffect will update the video element
        setIsScreenSharing(true);
        // Notify others that screen sharing started
        if (socket) {
          socket.emit('screenShareStarted', { chatId });
        }
        console.log('[Call] Screen sharing started');
      } catch (err: any) {
        console.error('[Call] Screen share error:', err);
        if (err.name !== 'NotAllowedError') {
          setMediaError('Could not share screen: ' + err.message);
        }
      }
    }
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

    // Stop screen share if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

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
      <main className="flex-1 p-4 overflow-hidden flex items-center justify-center">
        {remoteScreenShareUserId && remoteStreams[remoteScreenShareUserId] ? (
          /* Remote Screen Share Layout - Show remote screen share in fullscreen */
          <div className="w-full h-full flex flex-col lg:flex-row gap-2 lg:gap-4">
            {/* Main Screen Share View - Takes full height on mobile */}
            <div className="flex-1 relative rounded-xl lg:rounded-2xl overflow-hidden bg-black border border-white/20 min-h-[60vh] lg:min-h-0">
              <video
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                ref={(el) => {
                  if (el && remoteStreams[remoteScreenShareUserId]) {
                    el.srcObject = remoteStreams[remoteScreenShareUserId];
                  }
                }}
              />
              {/* Screen Share Badge */}
              <div className="absolute top-2 left-2 lg:top-3 lg:left-3">
                <div className="px-2 py-1 lg:px-3 lg:py-1.5 bg-blue-500/90 rounded-lg flex items-center gap-1.5 lg:gap-2 shadow-lg">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-[10px] lg:text-xs font-medium">{getDisplayName(remoteScreenShareUserId)} is sharing</span>
                </div>
              </div>
            </div>

            {/* Participant Thumbnails - Horizontal scroll on mobile, vertical sidebar on desktop */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden lg:w-44 pb-2 lg:pb-0">
              {/* Self-view */}
              <div className="relative rounded-lg lg:rounded-xl overflow-hidden bg-slate-800 border border-emerald-500/40 aspect-video flex-shrink-0 w-28 lg:w-full">
                <video
                  ref={localVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 lg:bottom-1.5 lg:left-1.5">
                  <span className="px-1 py-0.5 lg:px-1.5 bg-emerald-500/80 text-white text-[8px] lg:text-[10px] font-medium rounded">You</span>
                </div>
              </div>

              {/* Other remote participants (excluding the screen sharer - they're shown in main view) */}
              {Object.entries(remoteStreams)
                .filter(([userId]) => userId !== remoteScreenShareUserId)
                .map(([userId, stream]) => (
                  <div key={userId} className="relative rounded-lg lg:rounded-xl overflow-hidden bg-slate-800 border border-white/10 aspect-video flex-shrink-0 w-28 lg:w-full">
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      ref={(el) => {
                        if (el) el.srcObject = stream;
                      }}
                    />
                    <div className="absolute bottom-1 left-1 lg:bottom-1.5 lg:left-1.5">
                      <span className="px-1 py-0.5 lg:px-1.5 bg-black/60 text-white text-[8px] lg:text-[10px] rounded">{getDisplayName(userId)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : isScreenSharing ? (
          /* Local Screen Sharing Layout - Fullscreen on mobile */
          <div className="w-full h-full flex flex-col lg:flex-row gap-2 lg:gap-4">
            {/* Main Screen Share View - Takes full height on mobile */}
            <div className="flex-1 relative rounded-xl lg:rounded-2xl overflow-hidden bg-black border border-white/20 min-h-[60vh] lg:min-h-0">
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
              {/* Screen Share Badge */}
              <div className="absolute top-2 left-2 lg:top-3 lg:left-3">
                <div className="px-2 py-1 lg:px-3 lg:py-1.5 bg-green-500/90 rounded-lg flex items-center gap-1.5 lg:gap-2 shadow-lg">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-[10px] lg:text-xs font-medium">Sharing Screen</span>
                </div>
              </div>
            </div>

            {/* Participant Thumbnails - Horizontal scroll on mobile, vertical sidebar on desktop */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden lg:w-44 pb-2 lg:pb-0">
              {/* Self-view */}
              <div className="relative rounded-lg lg:rounded-xl overflow-hidden bg-slate-800 border border-emerald-500/40 aspect-video flex-shrink-0 w-28 lg:w-full">
                <video
                  ref={localVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 lg:bottom-1.5 lg:left-1.5">
                  <span className="px-1 py-0.5 lg:px-1.5 bg-emerald-500/80 text-white text-[8px] lg:text-[10px] font-medium rounded">You</span>
                </div>
              </div>

              {/* Remote participants */}
              {Object.entries(remoteStreams).map(([userId, stream]) => (
                <div key={userId} className="relative rounded-lg lg:rounded-xl overflow-hidden bg-slate-800 border border-white/10 aspect-video flex-shrink-0 w-28 lg:w-full">
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(el) => {
                      if (el) el.srcObject = stream;
                    }}
                  />
                  <div className="absolute bottom-1 left-1 lg:bottom-1.5 lg:left-1.5">
                    <span className="px-1 py-0.5 lg:px-1.5 bg-black/60 text-white text-[8px] lg:text-[10px] rounded">{getDisplayName(userId)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Normal Video Grid Layout */
          <div className="w-full max-w-5xl">
            {remoteCount === 0 ? (
              /* Solo view - waiting for others */
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-center">
                {/* Local Video - Centered */}
                <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-white/10">
                  {isAudioOnly || isCameraOff ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600/30 to-purple-600/30">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                        <span className="text-3xl text-white font-bold">
                          {user?.name?.charAt(0)?.toUpperCase() || 'Y'}
                        </span>
                      </div>
                      {isCameraOff && !isAudioOnly && (
                        <p className="mt-3 text-white/50 text-sm">Camera off</p>
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
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded-lg">You</span>
                    {isMuted && (
                      <span className="p-1.5 bg-red-500/80 rounded-lg">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>

                {/* Waiting indicator */}
                <div className="flex flex-col items-center gap-3 p-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm font-medium">Waiting for others...</p>
                </div>
              </div>
            ) : (
              /* Two+ people - Grid view */
              <div className={`grid gap-3 ${remoteCount === 1 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
                {/* Local Video */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                  {isAudioOnly || isCameraOff ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600/30 to-purple-600/30">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-2xl text-white font-bold">
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
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-black/50 text-white text-xs font-medium rounded">You</span>
                    {isMuted && (
                      <span className="p-1 bg-red-500/80 rounded">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>

                {/* Remote Videos */}
                {Object.entries(remoteStreams).map(([userId, stream]) => (
                  <div key={userId} className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      ref={(el) => {
                        if (el) el.srcObject = stream;
                      }}
                    />
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 bg-black/50 text-white text-xs rounded">{getDisplayName(userId)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

            {/* Screen Share Button */}
            <button
              onClick={toggleScreenShare}
              className={`group relative p-4 rounded-2xl transition-all duration-300 ${isScreenSharing
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-600'
                : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
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
