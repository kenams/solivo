import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, getToken, saveToken, clearToken } from "../lib/api";

interface User {
  id: string; name: string; email: string; role: string;
  points: number; maraudes_count: number; total_donations: number;
  badges?: { badge_key: string; name: string; icon: string }[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, loading: true,
  login: async () => {}, register: async () => {}, logout: async () => {}, refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getToken().then(async (t) => {
      if (t) { setToken(t); await loadProfile(); }
      setLoading(false);
    });
  }, []);

  async function loadProfile() {
    try {
      const data = await api.get("/auth/me");
      setUser(data);
    } catch { await clearToken(); setToken(null); setUser(null); }
  }

  async function login(email: string, password: string) {
    const data = await api.post("/auth/login", { email, password });
    await saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string) {
    const data = await api.post("/auth/register", { name, email, password });
    await saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function logout() {
    await clearToken();
    setToken(null);
    setUser(null);
  }

  async function refresh() { if (token) await loadProfile(); }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
