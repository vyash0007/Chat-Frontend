'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, PrimarySidebar } from '@/components/layout';
import { SearchUsersModal } from '@/components/chat/SearchUsersModal';
import { NewChatModal } from '@/components/chat/NewChatModal';
import { NewGroupModal } from '@/components/chat/NewGroupModal';
import { IncomingCallModal, OutgoingCallModal } from '@/components/call';
import { useAuthStore, useUIStore } from '@/store';
import { useSocket } from '@/hooks';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen, isMobile, setIsMobile, currentModal, closeModal } = useUIStore();
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
      <div className="flex items-center justify-center h-screen bg-[#f5f3ff]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background-primary)]">
      {/* 1. Primary Sidebar (Slim Icon Bar - Dark) */}
      <div className="hidden md:flex w-[90px] bg-[#1e1f25] flex-col items-center py-8 shrink-0 transition-all duration-300">
        <PrimarySidebar />
      </div>

      {/* 2. Secondary Sidebar (Chat List) - White */}
      <aside
        className={cn(
          "w-full md:w-80 bg-[var(--background-secondary)] border-r border-[var(--border-color)] flex-shrink-0 transition-all duration-300 relative",
          isMobile && !sidebarOpen && "hidden"
        )}
      >
        <Sidebar />
      </aside>

      {/* 3. Main Content Area - White */}
      <main className={cn(
        "flex-1 bg-[var(--background-secondary)] overflow-hidden flex transition-all duration-300 relative",
        isMobile && "pb-[72px]" // Space for bottom bar
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#1e1f25] border-t border-white/5 z-[var(--z-header)] flex items-center justify-around shadow-[0_-8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <PrimarySidebar layout="horizontal" />
        </nav>
      )}

      {/* Modals - Centralized at Root */}
      <SearchUsersModal />
      <NewChatModal
        isOpen={currentModal === 'createChat'}
        onClose={closeModal}
      />
      <NewGroupModal
        isOpen={currentModal === 'createGroup'}
        onClose={closeModal}
      />
      <IncomingCallModal />
      <OutgoingCallModal />
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
