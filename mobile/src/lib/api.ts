import * as SecureStore from "expo-secure-store";

const API = process.env.EXPO_PUBLIC_API_URL || "https://solivo-api.onrender.com";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("solivo_token");
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync("solivo_token", token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync("solivo_token");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path: string, body?: unknown) => apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }),
};
