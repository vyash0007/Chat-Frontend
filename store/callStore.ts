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
}

interface CallState {
    incomingCall: IncomingCall | null;
    outgoingCall: OutgoingCall | null;

    // Actions
    setIncomingCall: (call: IncomingCall | null) => void;
    setOutgoingCall: (call: OutgoingCall | null) => void;
    updateOutgoingCallStatus: (status: OutgoingCall['status']) => void;
    clearCalls: () => void;
    endCall: () => void;
}

export const useCallStore = create<CallState>()((set, get) => ({
    incomingCall: null,
    outgoingCall: null,

    setIncomingCall: (call) => set({ incomingCall: call }),

    setOutgoingCall: (call) => set({ outgoingCall: call }),

    updateOutgoingCallStatus: (status) => set((state) => ({
        outgoingCall: state.outgoingCall
            ? { ...state.outgoingCall, status }
            : null
    })),

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
