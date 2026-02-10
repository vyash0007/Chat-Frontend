import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <Link href="/" className="flex flex-col items-center mb-8 border-none hover:opacity-80 transition-opacity">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-[var(--accent-primary)] text-white mb-4 shadow-lg shadow-[var(--accent-primary)]/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L4 7L12 11L20 7L12 3Z" />
              <path d="M12 9L4 13L12 17L20 13L12 9Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light tracking-tight text-[var(--text-primary)]">
            Prism
          </h2>
        </Link>

        {/* Auth Card */}
        <div className="bg-[var(--background-primary)] rounded-md shadow-2xl p-8 border border-[var(--border-color)]">
          {children}
        </div>
      </div>
    </div>
  );
}
