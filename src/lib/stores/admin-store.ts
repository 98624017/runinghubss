"use client";

import { create } from "zustand";

interface AdminStoreState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  isLoggedIn: () => boolean;
}

export const useAdminStore = create<AdminStoreState>((set, get) => ({
  token: typeof window !== "undefined" ? sessionStorage.getItem("admin-token") : null,

  setToken: (token) => {
    sessionStorage.setItem("admin-token", token);
    set({ token });
  },

  clearToken: () => {
    sessionStorage.removeItem("admin-token");
    set({ token: null });
  },

  isLoggedIn: () => !!get().token,
}));
