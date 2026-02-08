import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-primary)] text-white text-2xl font-bold mb-4">
            C
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Chat App
          </h2>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--background-primary)] rounded-2xl shadow-[var(--shadow-xl)] p-8 border border-[var(--border-color)]">
          {children}
        </div>
      </div>
    </div>
  );
}
