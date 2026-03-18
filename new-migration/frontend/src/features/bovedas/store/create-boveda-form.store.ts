'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreateBovedaFormValues } from '../types';
import { defaultCreateBovedaValues } from '../types';

interface CreateBovedaFormStore {
  values: CreateBovedaFormValues;
  setField: <K extends keyof CreateBovedaFormValues>(field: K, value: CreateBovedaFormValues[K]) => void;
  reset: () => void;
}

export const useCreateBovedaFormStore = create<CreateBovedaFormStore>()(
  persist(
    (set) => ({
      values: defaultCreateBovedaValues,
      setField: (field, value) =>
        set((state) => ({
          values: {
            ...state.values,
            [field]: value,
          },
        })),
      reset: () =>
        set({
          values: defaultCreateBovedaValues,
        }),
    }),
    {
      name: 'create-boveda-form',
      partialize: (state) => ({
        values: state.values,
      }),
    },
  ),
);