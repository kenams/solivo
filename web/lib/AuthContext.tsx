"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api } from "./api";

interface User {
  id: string; name: string; email: string; role: string;
  points: number; maraudes_count: number; total_donations: number;
  badges?: { badge_key: string; name: string; icon: string }[];
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => {}, register: async () => {}, logout: () => {}, refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("solivo_token") : null;
    if (token) {
      api.get("/auth/me")
        .then((data: User) => { setUser(data); localStorage.setItem("solivo_user", JSON.stringify(data)); })
        .catch(() => { localStorage.removeItem("solivo_token"); localStorage.removeItem("solivo_user"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("solivo_token", data.token);
    localStorage.setItem("solivo_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string, role = "volunteer") {
    const data = await api.post("/auth/register", { name, email, password, role });
    localStorage.setItem("solivo_token", data.token);
    localStorage.setItem("solivo_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("solivo_token");
    localStorage.removeItem("solivo_user");
    setUser(null);
  }

  const refresh = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("solivo_token") : null;
    if (!token) return;
    try {
      const data = await api.get("/auth/me");
      setUser(data);
      localStorage.setItem("solivo_user", JSON.stringify(data));
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
