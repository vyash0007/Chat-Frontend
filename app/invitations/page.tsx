'use client';

import { useEffect } from 'react';
import { useInvitationStore } from '@/store/invitationStore';
import { useRouter } from 'next/navigation';
import { InvitationType } from '@/types';

export default function InvitationsPage() {
  const { pendingInvitations, fetchPendingInvitations, acceptInvitation, isLoading } =
    useInvitationStore();
  const router = useRouter();

  useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  const handleAccept = async (token: string) => {
    try {
      const result = await acceptInvitation(token);

      if (result.type === InvitationType.PERMANENT_MEMBER) {
        router.push(`/chats/${result.chatId}`);
      } else {
        router.push(`/call?chatId=${result.chatId}`);
      }
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-secondary)] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Pending Invitations
          </h1>
          <button
            onClick={() => router.push('/chats')}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Back to Chats
          </button>
        </div>

        {isLoading && pendingInvitations.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-[var(--background-primary)] rounded-lg p-4 border border-[var(--border-color)] animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full skeleton" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 rounded skeleton" />
                    <div className="h-3 w-1/4 rounded skeleton" />
                  </div>
                  <div className="h-9 w-20 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : pendingInvitations.length === 0 ? (
          <div className="bg-[var(--background-primary)] rounded-lg p-8 text-center">
            <svg
              className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
            <p className="text-[var(--text-muted)]">No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-[var(--background-primary)] rounded-lg p-4 border border-[var(--divider-color)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {invitation.chat?.avatar ? (
                      <img
                        src={invitation.chat.avatar}
                        alt={invitation.chat.name || 'Chat'}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] text-white font-semibold flex items-center justify-center flex-shrink-0">
                        {(invitation.chat?.name || 'C')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {invitation.chat?.name || 'Unnamed Chat'}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        Invited by {invitation.inviter?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                        <span className="px-2 py-0.5 bg-[var(--background-secondary)] rounded">
                          {invitation.type === InvitationType.PERMANENT_MEMBER
                            ? 'Permanent Member'
                            : 'Call Access'}
                        </span>
                        <span>
                          Expires{' '}
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAccept(invitation.token)}
                    disabled={isLoading}
                    className="bg-[var(--accent-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0 text-sm"
                  >
                    {isLoading ? 'Accepting...' : 'Accept'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
