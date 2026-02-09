'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    MicOff,
    Mic,
    VideoOff,
    Video,
    MonitorUp,
    PhoneMissed,
    Smile,
    X,
    Paperclip,
    Send,
    ChevronDown,
    Users,
    Settings,
    MoreVertical,
    Maximize2,
} from 'lucide-react';
import { useCallStore, useAuthStore, useChatStore, useUserStore } from '@/store';
import { cn, formatTime } from '@/lib/utils';
import { UserAvatar } from '@/components/user';
import { MessageType, User } from '@/types';

interface CallInterfaceProps {
    onBack: () => void;
    isVideoCall?: boolean;
}

const IconButton = ({
    icon: Icon,
    active,
    color = 'normal',
    onClick,
    className
}: {
    icon: any,
    active?: boolean,
    color?: 'normal' | 'active' | 'danger' | 'primary',
    onClick?: () => void,
    className?: string
}) => {
    const baseClasses = "p-3 rounded-sm transition-all duration-200 flex items-center justify-center backdrop-blur-md border";
    const colorClasses = {
        normal: "bg-white/5 border-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] hover:border-white/10",
        active: "bg-[var(--text-primary)] text-[var(--background-primary)] border-[var(--text-primary)] hover:opacity-90",
        danger: "bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white",
        primary: "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]"
    };

    return (
        <button onClick={onClick} className={cn(baseClasses, colorClasses[color], className)}>
            <Icon size={20} />
        </button>
    );
};

const VideoCard = ({
    participant,
    isMain = false,
    isMuted = false,
    isCameraOff = false
}: {
    participant: User | null,
    isMain?: boolean,
    isMuted?: boolean,
    isCameraOff?: boolean
}) => (
    <div className={cn(
        "relative rounded-md overflow-hidden group border border-[var(--border-color)] bg-[var(--background-secondary)]",
        isMain ? "w-full h-full" : "w-48 h-32 flex-shrink-0"
    )}>
        {/* Video Placeholder/Image */}
        {isCameraOff ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--background-tertiary)] to-[var(--background-primary)]">
                <div className="text-center">
                    <div className={cn(
                        "rounded-full bg-[var(--accent-primary)] flex items-center justify-center mx-auto mb-3 text-white shadow-glow",
                        isMain ? "w-24 h-24 text-2xl" : "w-12 h-12 text-sm"
                    )}>
                        {participant?.name?.slice(0, 2).toUpperCase() || '?'}
                    </div>
                    {isMain && <p className="text-[var(--text-muted)] text-xs font-light tracking-tight">Camera is off</p>}
                </div>
            </div>
        ) : (
            <>
                <div className="w-full h-full bg-[var(--background-tertiary)] animate-pulse flex items-center justify-center">
                    <UserAvatar user={participant!} size={isMain ? "xl" : "lg"} />
                </div>
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
            </>
        )}

        {/* Name Tag */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-2">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-sm flex items-center space-x-2">
                {isMuted ? (
                    <MicOff size={10} className="text-red-400" />
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
                <span className="text-white text-[10px] sm:text-xs font-light tracking-tight">{participant?.name || 'Connecting...'}</span>
            </div>
        </div>

        {/* Connection Status Indicator */}
        {isMain && (
            <div className="absolute top-4 right-4 flex space-x-1">
                <div className="w-1 h-3 bg-green-500/80 rounded-full"></div>
                <div className="w-1 h-3 bg-green-500/80 rounded-full"></div>
                <div className="w-1 h-3 bg-green-500/80 rounded-full"></div>
            </div>
        )}
    </div>
);

export const CallInterface: React.FC<CallInterfaceProps> = ({ onBack, isVideoCall = true }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [messageText, setMessageText] = useState('');

    const { user: currentUser } = useAuthStore();
    const { activeChat, messages: allMessages, sendMessage } = useChatStore();
    const { onlineUsers } = useUserStore();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get current chat messages
    const chatId = activeChat?.id;
    const chatMessages = chatId ? allMessages[chatId] || [] : [];

    // Scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages.length, showChat]);

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!messageText.trim() || !chatId) return;

        sendMessage({
            chatId,
            content: messageText,
            type: MessageType.TEXT
        });
        setMessageText('');
    };

    // Determine participants
    const participants = activeChat?.users || [];
    const otherParticipants = participants.filter(u => u.id !== currentUser?.id);
    const mainParticipant = otherParticipants[0];

    return (
        <div className="h-full bg-[var(--background-primary)] text-[var(--text-primary)] overflow-hidden flex flex-col font-light tracking-tight selection:bg-[var(--accent-primary)]/30 animate-fade-in relative">

            {/* --- Ambient Background Glows --- */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[var(--accent-primary)]/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* --- Header --- */}
            <header className="h-20 px-6 flex items-center justify-between z-10 border-b border-[var(--border-color)] bg-[var(--background-primary)]/80 backdrop-blur-md">
                <div className="flex items-center space-x-4">
                    <div
                        onClick={onBack}
                        className="w-10 h-10 bg-[var(--background-secondary)] rounded-sm flex items-center justify-center border border-[var(--border-color)] cursor-pointer hover:bg-[var(--background-hover)] transition-colors group"
                    >
                        <ChevronDown size={20} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                    </div>
                    <div>
                        <h1 className="text-base font-light tracking-tight text-[var(--text-primary)]">
                            {activeChat?.name || (isVideoCall ? 'Video Call' : 'Voice Call')}
                        </h1>
                        <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono tracking-widest uppercase">Ongoing</span>
                            <span className="text-[10px] text-[var(--border-color)] px-1">|</span>
                            <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase font-light">Secure</span>
                        </div>
                    </div>
                </div>

                <div className="hidden sm:flex items-center space-x-3">
                    <div className="flex -space-x-2 mr-4">
                        {otherParticipants.slice(0, 3).map(p => (
                            <div key={p.id} className="w-8 h-8 rounded-full border-2 border-[var(--background-primary)] overflow-hidden shadow-sm">
                                <UserAvatar user={p} size="sm" />
                            </div>
                        ))}
                        {otherParticipants.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] border-2 border-[var(--background-primary)] flex items-center justify-center text-[9px] font-light text-[var(--text-muted)]">
                                +{otherParticipants.length - 3}
                            </div>
                        )}
                    </div>
                    <IconButton icon={Users} />
                    <IconButton icon={Settings} />
                </div>
            </header>

            {/* --- Main Content Area --- */}
            <main className="flex-1 flex overflow-hidden relative z-1 p-4 gap-4">

                {/* Video/Audio Grid Stage */}
                <div className="flex-1 flex flex-col min-w-0">
                    {isVideoCall ? (
                        <>
                            {/* Main Stage */}
                            <div className="flex-1 relative mb-4">
                                <VideoCard
                                    participant={mainParticipant || null}
                                    isMain={true}
                                    isCameraOff={false} // Would be driven by real state in a real app
                                />

                                {/* Floating Reaction Overlay (Future proofing) */}
                                <div className="absolute bottom-10 right-10 pointer-events-none select-none">
                                    <div className="text-4xl animate-bounce opacity-0 group-hover:opacity-100 duration-1000">👏</div>
                                </div>
                            </div>

                            {/* Thumbnails Strip */}
                            <div className="h-32 flex space-x-4 overflow-x-auto pb-2 custom-scrollbar">
                                {/* Self Participant */}
                                <VideoCard
                                    participant={currentUser}
                                    isMuted={isMuted}
                                    isCameraOff={isVideoOff}
                                />

                                {/* Other Participants */}
                                {otherParticipants.slice(1).map(p => (
                                    <VideoCard
                                        key={p.id}
                                        participant={p}
                                        isMuted={!onlineUsers.has(p.id)} // Mock mute state
                                    />
                                ))}

                                {otherParticipants.length > 4 && (
                                    <div className="w-48 h-32 flex-shrink-0 bg-[var(--background-secondary)] rounded-md border border-[var(--border-color)] flex flex-col items-center justify-center group cursor-pointer hover:border-[var(--accent-primary)]/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-2 group-hover:bg-[var(--accent-primary)]/10 group-hover:text-[var(--accent-primary)] transition-colors">
                                            <span className="font-light text-xs">+{otherParticipants.length - 4}</span>
                                        </div>
                                        <span className="text-[10px] text-[var(--text-muted)] font-light tracking-widest uppercase">View all</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // Redesigned Voice Call UI (Obsidian Premium)
                        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[var(--background-secondary)]/30 rounded-md border border-[var(--border-color)]">
                            <div className="absolute inset-0 bg-[var(--accent-primary)]/[0.02] animate-pulse"></div>

                            <div className="text-center z-10 transition-all duration-500">
                                <div className="relative mb-10">
                                    {/* Pulse Rings */}
                                    <div className="absolute inset-0 rounded-full bg-[var(--accent-primary)]/20 animate-ping opacity-20 duration-1000"></div>
                                    <div className="absolute inset-[-20px] rounded-full border border-[var(--accent-primary)]/10 animate-pulse duration-700"></div>

                                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[var(--background-tertiary)] to-[var(--background-primary)] flex items-center justify-center mx-auto shadow-2xl relative z-10 border-2 border-[var(--border-color)] group overflow-hidden">
                                        {mainParticipant?.avatar ? (
                                            <img src={mainParticipant.avatar} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                        ) : (
                                            <span className="text-5xl font-light tracking-tight text-[var(--accent-primary)]">
                                                {mainParticipant?.name?.slice(0, 2).toUpperCase() || '?'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-[var(--background-modal)] px-5 py-2 rounded-full shadow-xl border border-[var(--border-color)] backdrop-blur-md">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse"></div>
                                            <span className="text-[10px] font-light tracking-[0.2em] text-[var(--accent-primary)] uppercase">Voice Call</span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-3xl font-light tracking-tight text-[var(--text-primary)] mb-2 mt-4">
                                    {mainParticipant?.name || 'Connecting...'}
                                </h3>
                                <p className="text-sm text-[var(--text-muted)] font-light tracking-tight opacity-70">
                                    Secure Audio Transmission
                                </p>

                                {/* Group Participants indicator in voice call */}
                                {activeChat?.isGroup && otherParticipants.length > 1 && (
                                    <div className="flex justify-center -space-x-3 mt-12 opacity-80">
                                        {otherParticipants.slice(1, 6).map(p => (
                                            <div key={p.id} className="w-10 h-10 rounded-full border-2 border-[var(--background-primary)] shadow-sm">
                                                <UserAvatar user={p} size="sm" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (Chat Panel) */}
                {showChat && (
                    <div className="hidden lg:flex w-80 bg-[var(--background-secondary)]/50 backdrop-blur-xl border border-[var(--border-color)] rounded-md flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="h-16 px-6 border-b border-[var(--border-color)] flex items-center justify-between">
                            <h3 className="font-light tracking-tight text-sm text-[var(--text-primary)] uppercase tracking-widest">Meeting Chat</h3>
                            <button onClick={() => setShowChat(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-[var(--background-primary)]/10">
                            {chatMessages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                                    <MessageSquare size={32} className="mb-4 text-[var(--text-muted)]" />
                                    <p className="text-xs font-light tracking-tight text-[var(--text-secondary)]">Start the conversation</p>
                                </div>
                            )}
                            {chatMessages.map(msg => {
                                const isMe = msg.senderId === currentUser?.id;
                                const sender = participants.find(u => u.id === msg.senderId);

                                return (
                                    <div key={msg.id} className={cn("flex", isMe ? 'justify-end' : 'justify-start')}>
                                        {!isMe && sender && (
                                            <div className="mt-1 mr-2">
                                                <UserAvatar user={sender} size="sm" />
                                            </div>
                                        )}
                                        <div className={cn("max-w-[85%] flex flex-col", isMe ? 'items-end' : 'items-start')}>
                                            {!isMe && sender && (
                                                <p className="text-[9px] text-[var(--text-muted)] mb-1 ml-1 font-light tracking-tight">
                                                    {sender.name}
                                                </p>
                                            )}
                                            <div className={cn(
                                                "p-3 rounded-md text-[13px] font-light tracking-tight leading-relaxed shadow-sm",
                                                isMe
                                                    ? 'bg-[var(--accent-primary)] text-white rounded-tr-none'
                                                    : 'bg-[var(--background-modal)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-none'
                                            )}>
                                                {msg.content}
                                            </div>
                                            <p className="text-[9px] text-[var(--text-muted)] mt-1 font-light opacity-50">
                                                {formatTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--background-secondary)]/50">
                            <form
                                onSubmit={handleSendMessage}
                                className="relative group"
                            >
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-[var(--background-primary)] border border-[var(--border-color)] rounded-sm py-2.5 pl-4 pr-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all font-light tracking-tight"
                                />
                                <button
                                    type="submit"
                                    disabled={!messageText.trim()}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[var(--accent-primary)] rounded-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                            <div className="flex items-center space-x-3 mt-3 px-1 text-[var(--text-muted)]">
                                <Paperclip size={16} className="hover:text-[var(--text-primary)] cursor-pointer transition-colors" />
                                <Smile size={16} className="hover:text-[var(--text-primary)] cursor-pointer transition-colors" />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* --- Floating Control Bar (Redesigned) --- */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center space-x-2 sm:space-x-3 bg-[var(--background-modal)]/80 backdrop-blur-xl border border-[var(--border-color)] p-2 rounded-sm shadow-2xl ring-1 ring-white/5">

                    <IconButton
                        icon={isMuted ? MicOff : Mic}
                        color={isMuted ? 'danger' : 'normal'}
                        onClick={() => setIsMuted(!isMuted)}
                    />

                    {isVideoCall && (
                        <IconButton
                            icon={isVideoOff ? VideoOff : Video}
                            color={isVideoOff ? 'danger' : 'normal'}
                            onClick={() => setIsVideoOff(!isVideoOff)}
                        />
                    )}

                    <IconButton icon={MonitorUp} />

                    <div className="w-px h-8 bg-[var(--border-color)] mx-1 sm:mx-2"></div>

                    <button
                        onClick={onBack}
                        className="px-6 sm:px-10 py-3 bg-[var(--danger)] text-white rounded-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--danger)]/20 flex items-center justify-center group"
                    >
                        <PhoneMissed size={22} className="group-hover:animate-shake" />
                        <span className="ml-3 hidden sm:inline text-xs font-light tracking-[0.2em] uppercase">End Call</span>
                    </button>

                    <div className="w-px h-8 bg-[var(--border-color)] mx-1 sm:mx-2"></div>

                    <IconButton
                        icon={Smile}
                        className="hidden sm:flex"
                    />

                    <IconButton
                        icon={Maximize2}
                        className="hidden sm:flex"
                    />

                    <IconButton
                        icon={X}
                        color={showChat ? 'primary' : 'normal'}
                        onClick={() => setShowChat(!showChat)}
                        className="lg:hidden"
                    />

                    <IconButton
                        icon={MoreVertical}
                    />
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

const MessageSquare = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);
