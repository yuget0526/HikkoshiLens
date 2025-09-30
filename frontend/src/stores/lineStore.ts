import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LineStation = {
  station_code: string;
  name: string;
  line_name: string;
  company: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

type LineStoreState = {
  selectedLine: {
    line_name: string;
    company: string;
  } | null;
  setSelectedLine: (line_name: string, company: string) => void;
  clearSelectedLine: () => void;
};

export const useLineStore = create<LineStoreState>()(
  persist(
    (set) => ({
      selectedLine: null,
      setSelectedLine: (line_name, company) =>
        set({ selectedLine: { line_name, company } }),
      clearSelectedLine: () => set({ selectedLine: null }),
    }),
    {
      name: "line-store",
    }
  )
);
