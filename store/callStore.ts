'use client';

import { create } from 'zustand';

export interface IncomingCall {
    chatId: string;
    callerId: string;
    callerName: string;
    callerAvatar: string | null;
    isVideoCall: boolean;
}

export interface OutgoingCall {
    chatId: string;
    isVideoCall: boolean;
    status: 'ringing' | 'accepted' | 'rejected' | 'cancelled';
    targetName?: string;
    targetAvatar?: string | null;
}

export interface CallHistoryItem {
    id: string;
    chatId: string;
    targetName: string;
    targetAvatar: string | null;
    isVideoCall: boolean;
    timestamp: Date;
    status: 'incoming' | 'outgoing' | 'missed' | 'rejected';
    duration?: number; // in seconds
    isGroup?: boolean;
}

interface CallState {
    incomingCall: IncomingCall | null;
    outgoingCall: OutgoingCall | null;
    callHistory: CallHistoryItem[];

    // Actions
    setIncomingCall: (call: IncomingCall | null) => void;
    setOutgoingCall: (call: OutgoingCall | null) => void;
    updateOutgoingCallStatus: (status: OutgoingCall['status']) => void;
    addToHistory: (item: CallHistoryItem) => void;
    fetchHistory: (token: string, currentUserId: string) => Promise<void>;
    clearCalls: () => void;
    endCall: () => void;
}

export const useCallStore = create<CallState>()((set, get) => ({
    incomingCall: null,
    outgoingCall: null,
    callHistory: [],

    setIncomingCall: (call) => set({ incomingCall: call }),

    setOutgoingCall: (call) => set({ outgoingCall: call }),

    updateOutgoingCallStatus: (status) => set((state) => ({
        outgoingCall: state.outgoingCall
            ? { ...state.outgoingCall, status }
            : null
    })),

    addToHistory: (item) => set((state) => ({
        callHistory: [item, ...state.callHistory].slice(0, 50) // Keep last 50 calls
    })),

    fetchHistory: async (token: string, currentUserId: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/call/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch call history');

            const data = await response.json();

            const history: CallHistoryItem[] = data.map((item: any) => {
                const isCaller = item.callerId === currentUserId;
                const isGroup = item.chat.isGroup;

                let targetName = '';
                let targetAvatar = null;

                if (isGroup) {
                    targetName = item.chat.name || 'Group Call';
                    targetAvatar = item.chat.avatar;
                } else {
                    const otherUser = isCaller ? item.target : item.caller;
                    targetName = otherUser?.name || 'Unknown';
                    targetAvatar = otherUser?.avatar || null;
                }

                let status: CallHistoryItem['status'] = 'incoming';
                if (isCaller) {
                    status = 'outgoing';
                } else if (item.status === 'MISSED' || item.status === 'CANCELLED') {
                    status = 'missed';
                } else if (item.status === 'REJECTED') {
                    status = 'rejected';
                }

                return {
                    id: item.id,
                    chatId: item.chatId,
                    targetName,
                    targetAvatar,
                    isVideoCall: item.isVideo,
                    timestamp: new Date(item.createdAt),
                    status,
                    duration: item.duration,
                    isGroup
                };
            });

            set({ callHistory: history });
        } catch (error) {
            console.error('Error fetching call history:', error);
        }
    },

    clearCalls: () => set({ incomingCall: null, outgoingCall: null }),

    endCall: () => {
        const { incomingCall, outgoingCall } = get();
        const { leaveCall, cancelCall } = require('@/lib/socket');

        if (incomingCall) {
            leaveCall(incomingCall.chatId);
        } else if (outgoingCall) {
            if (outgoingCall.status === 'ringing') {
                cancelCall(outgoingCall.chatId);
            } else {
                leaveCall(outgoingCall.chatId);
            }
        }

        set({ incomingCall: null, outgoingCall: null });
    },
}));
