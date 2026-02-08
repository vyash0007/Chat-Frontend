'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInvitationStore } from '@/store/invitationStore';
import { InvitationType } from '@/types';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { acceptInvitation, error } = useInvitationStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [chatInfo, setChatInfo] = useState<{ chatId: string; type: InvitationType } | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      return;
    }

    const handleAccept = async () => {
      try {
        const result = await acceptInvitation(token);
        setChatInfo(result);
        setStatus('success');

        setTimeout(() => {
          if (result.type === InvitationType.PERMANENT_MEMBER) {
            router.push(`/chats/${result.chatId}`);
          } else {
            router.push(`/call?chatId=${result.chatId}`);
          }
        }, 2000);
      } catch {
        setStatus('error');
      }
    };

    handleAccept();
  }, [searchParams, acceptInvitation, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] p-4">
      <div className="max-w-md w-full bg-[var(--background-primary)] rounded-xl shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Processing Invitation
            </h2>
            <p className="text-[var(--text-muted)]">
              Please wait while we process your invitation...
            </p>
          </div>
        )}

        {status === 'success' && chatInfo && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Invitation Accepted!
            </h2>
            <p className="text-[var(--text-muted)]">
              {chatInfo.type === InvitationType.PERMANENT_MEMBER
                ? 'You have been added to the chat. Redirecting...'
                : 'You can now join the call. Redirecting...'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Invitation Failed
            </h2>
            <p className="text-[var(--text-muted)] mb-4">
              {error || 'This invitation may be invalid, expired, or has already been used.'}
            </p>
            <button
              onClick={() => router.push('/chats')}
              className="bg-[var(--accent-primary)] text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Go to Chats
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)]">
          <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
