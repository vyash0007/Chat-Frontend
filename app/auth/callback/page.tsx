'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleGoogleCallback } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      handleGoogleCallback(token)
        .then(() => {
          // Check if user needs to complete profile
          const { user } = useAuthStore.getState();
          if (!user?.name) {
            router.push('/profile');
          } else {
            router.push('/chats');
          }
        })
        .catch((error) => {
          console.error('Authentication failed:', error);
          router.push('/login?error=auth_failed');
        });
    } else {
      router.push('/login?error=no_token');
    }
  }, [searchParams, router, handleGoogleCallback]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background-primary)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
        <p className="mt-4 text-[var(--text-muted)]">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[var(--background-primary)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
            <p className="mt-4 text-[var(--text-muted)]">Completing sign in...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
