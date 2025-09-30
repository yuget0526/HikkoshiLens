import { create } from "zustand";
import { persist } from "zustand/middleware";

export const WEIGHT_KEYS = [
  "access",
  "life",
  "fun",
  "safety",
  "env",
  "cost",
] as const;
export type WeightKey = (typeof WEIGHT_KEYS)[number];

interface PreferenceState {
  weights: Record<WeightKey, number>;
  setWeights: (weights: Record<WeightKey, number>) => void;
  resetWeights: () => void;
}

// デフォルトの重みづけ
const DEFAULT_WEIGHTS: Record<WeightKey, number> = {
  access: 24,
  life: 18,
  fun: 20,
  safety: 18,
  env: 10,
  cost: 10,
};

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      weights: DEFAULT_WEIGHTS,
      setWeights: (weights) => set({ weights }),
      resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),
    }),
    {
      name: "hikkoshilens-preferences",
    }
  )
);

// 重みの正規化ヘルパー関数
export function normalizeWeights(
  w: Record<WeightKey, number>
): Record<WeightKey, number> {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const even = 100 / WEIGHT_KEYS.length;
    return WEIGHT_KEYS.reduce(
      (acc, k) => ({ ...acc, [k]: even }),
      {} as Record<WeightKey, number>
    );
  }
  const k = 100 / sum;
  return WEIGHT_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: w[key] * k }),
    {} as Record<WeightKey, number>
  );
}
