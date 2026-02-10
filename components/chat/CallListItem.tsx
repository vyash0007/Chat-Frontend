'use client';

import React from 'react';
import { UserAvatar } from '@/components/user';
import { CallHistoryItem } from '@/store/callStore';
import { formatDate, cn } from '@/lib/utils';
import { FaVideo, FaPhoneAlt } from 'react-icons/fa';
import { MdCallReceived, MdCallMade, MdCallMissed } from 'react-icons/md';
import { initiateCall } from '@/lib/socket';
import { useCallStore } from '@/store';

interface CallListItemProps {
    item: CallHistoryItem;
}

export const CallListItem: React.FC<CallListItemProps> = ({ item }) => {
    const { setOutgoingCall } = useCallStore();

    const handleCall = () => {
        initiateCall(item.chatId, item.isVideoCall);
        setOutgoingCall({
            chatId: item.chatId,
            isVideoCall: item.isVideoCall,
            status: 'ringing',
            targetName: item.targetName,
            targetAvatar: item.targetAvatar
        });
    };

    const getStatusIcon = () => {
        switch (item.status) {
            case 'incoming': return <MdCallReceived className="text-[var(--success)]" size={14} />;
            case 'outgoing': return <MdCallMade className="text-[var(--accent-primary)]" size={14} />;
            case 'missed': return <MdCallMissed className="text-[var(--danger)]" size={14} />;
            case 'rejected': return <MdCallMissed className="text-[var(--danger)]" size={14} />;
            default: return null;
        }
    };

    return (
        <div className="flex items-center p-3 mb-1 rounded-md hover:bg-[var(--background-hover)] transition-all w-full group">
            <div className="relative flex-shrink-0">
                <UserAvatar
                    user={null}
                    name={item.targetName}
                    avatar={item.targetAvatar}
                    size="mdl"
                />
            </div>

            <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-sm font-light tracking-tight truncate leading-tight text-[var(--text-primary)]">
                        {item.targetName}
                    </h3>
                    <span className="text-[10px] font-light tracking-tight text-[var(--text-muted)] flex-shrink-0 ml-2">
                        {formatDate(item.timestamp)}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-light tracking-tight text-[var(--text-secondary)]">
                    {getStatusIcon()}
                    <span className="capitalize">{item.status}</span>
                    <span className="mx-1 opacity-30">•</span>
                    {item.isVideoCall ? 'Video Call' : 'Voice Call'}
                </div>
            </div>

            <button
                onClick={handleCall}
                className="ml-2 p-2 rounded-full bg-[var(--background-tertiary)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] transition-all"
                title={`Call ${item.targetName} back`}
            >
                {item.isVideoCall ? <FaVideo size={14} /> : <FaPhoneAlt size={14} />}
            </button>
        </div>
    );
};

export const CallListItemSkeleton: React.FC = () => {
    return (
        <div className="flex items-center p-3 mb-1 rounded-md w-full animate-fade-in">
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full skeleton" />
            </div>
            <div className="ml-3 flex-1">
                <div className="flex justify-between items-baseline mb-2">
                    <div className="h-4 w-24 rounded skeleton" />
                    <div className="h-3 w-10 rounded skeleton" />
                </div>
                <div className="h-3 w-32 rounded skeleton" />
            </div>
        </div>
    );
};
