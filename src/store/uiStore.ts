import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  modals: {
    [key: string]: boolean;
  };
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null;
  toggleSidebar: () => void;
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
  showToast: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  modals: {},
  toast: null,
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),
  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),
  showToast: (message, type) =>
    set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));
