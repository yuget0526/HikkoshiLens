import { create } from "zustand";

type UiState = {
  isFooterExpanded: boolean;
  toggleFooter: () => void;
  setFooterExpanded: (v: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isFooterExpanded: false,
  toggleFooter: () => set((s) => ({ isFooterExpanded: !s.isFooterExpanded })),
  setFooterExpanded: (v) => set({ isFooterExpanded: v }),
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (v) => set({ isSidebarOpen: v }),
}));
