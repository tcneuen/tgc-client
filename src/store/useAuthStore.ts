import { create } from "zustand";
import { API_BASE } from "../utils/api";

interface AuthState {
  token: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return res.status === 403 ? "Invalid email or password" : "Login failed";
    }

    const token: string = await res.json();
    localStorage.setItem("token", token);
    set({ token });
    return null;
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null });
  },
}));

export default useAuthStore;
