import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ApiKeyState {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isKeySet: () => boolean;
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      apiKey: "",
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: "" }),
      isKeySet: () => get().apiKey.length > 0,
    }),
    { name: "yueanji-api-key" }
  )
);
