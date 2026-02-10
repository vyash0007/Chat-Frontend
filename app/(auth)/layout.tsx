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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
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
