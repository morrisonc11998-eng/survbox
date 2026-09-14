import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UnitSystem = "us" | "metric";

type UnitsState = {
  system: UnitSystem;
  setSystem: (s: UnitSystem) => void;
};

const memory: Record<string, string> = {};

export const useUnits = create<UnitsState>()(
  persist(
    (set) => ({
      system: "us",
      setSystem: (system) => set({ system }),
    }),
    {
      name: "survbox-units",
      skipHydration: true,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: (k) => memory[k] ?? null,
            setItem: (k, v) => {
              memory[k] = v;
            },
            removeItem: (k) => {
              delete memory[k];
            },
          };
        }
        return localStorage;
      }),
    },
  ),
);
