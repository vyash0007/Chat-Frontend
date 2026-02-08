'use client';

import React, { useEffect, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount (Zustand hydrates from localStorage on mount)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize WebSocket connection
  useSocket();

  useEffect(() => {
    // Only redirect after component has mounted and Zustand has hydrated
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    // Detect mobile viewport and close sidebar on mobile by default
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        useUIStore.getState().setSidebarOpen(false);
      } else {
        useUIStore.getState().setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background-primary)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background-primary)]">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[var(--z-fixed)]"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'fixed inset-y-0 left-0 z-[var(--z-modal-backdrop)]' : 'relative'}
          w-[var(--sidebar-width)] bg-[var(--background-secondary)] border-r border-[var(--divider-color)]
          transition-transform duration-300 ease-in-out
        `}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Modals */}
      <SearchUsersModal />
    </div>
  );
}
