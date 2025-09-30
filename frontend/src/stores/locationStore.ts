import { create } from "zustand";

interface LocationState {
  workLocation: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  setWorkLocation: (
    location: { lat: number; lng: number; address: string } | null
  ) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  workLocation: null,
  setWorkLocation: (location) => set({ workLocation: location }),
}));
