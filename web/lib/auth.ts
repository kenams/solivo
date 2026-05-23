"use client";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("solivo_token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("solivo_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveAuth(token: string, user: unknown) {
  localStorage.setItem("solivo_token", token);
  localStorage.setItem("solivo_user", JSON.stringify(user));
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("solivo_token");
  localStorage.removeItem("solivo_user");
  window.location.href = "/";
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
