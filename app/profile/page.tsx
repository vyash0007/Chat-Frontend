'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, isLoading } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      await updateProfile({ name, email: email || undefined });
      router.push('/chats');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Let's get to know you better
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Display Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            error={error}
            required
          />

          <Input
            label="Email (Optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!name.trim()}
            fullWidth
            size="lg"
          >
            Continue to Chat
          </Button>
        </form>
      </div>
    </div>
  );
}
