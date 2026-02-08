'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { SearchUsersModal } from '@/components/chat/SearchUsersModal';
import { useAuthStore, useUIStore } from '@/store';
import { useSocket } from '@/hooks';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen, isMobile, setIsMobile } = useUIStore();

  // Initialize WebSocket connection
  useSocket();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Detect mobile viewport
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background-primary)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background-primary)]">
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'fixed inset-y-0 left-0 z-[var(--z-fixed)]' : 'relative'}
          w-[var(--sidebar-width)] bg-[var(--background-secondary)] border-r border-[var(--divider-color)]
          transition-transform duration-300 ease-in-out
        `}
      >
        <Sidebar />
      </aside>

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[var(--z-modal-backdrop)]"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Modals */}
      <SearchUsersModal />
    </div>
  );
}
