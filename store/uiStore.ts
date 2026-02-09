'use client';

import { create } from 'zustand';

type ModalType =
  | 'createChat'
  | 'createGroup'
  | 'chatSettings'
  | 'profile'
  | 'settings'
  | 'lightbox'
  | 'confirmDelete'
  | null;

interface ModalData {
  [key: string]: any;
}

interface UIState {
  sidebarOpen: boolean;
  groupInfoPanelOpen: boolean;
  currentModal: ModalType;
  modalData: ModalData;
  theme: 'light' | 'dark' | 'system';
  isMobile: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleGroupInfoPanel: () => void;
  setGroupInfoPanelOpen: (open: boolean) => void;
  openModal: (modal: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  groupInfoPanelOpen: false,
  currentModal: null,
  modalData: {},
  theme: 'system',
  isMobile: false,

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  toggleGroupInfoPanel: () => set(state => ({ groupInfoPanelOpen: !state.groupInfoPanelOpen })),

  setGroupInfoPanelOpen: (open: boolean) => set({ groupInfoPanelOpen: open }),

  openModal: (modal: ModalType, data: ModalData = {}) =>
    set({ currentModal: modal, modalData: data }),

  closeModal: () => set({ currentModal: null, modalData: {} }),

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });

    // Apply theme to document
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  setIsMobile: (isMobile: boolean) => set({ isMobile }),
}));
