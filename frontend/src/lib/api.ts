export const API_BASE = "http://localhost:5000/api";

const TOKEN_KEY = "sewasathi_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders(options.headers),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string; error?: string };
      message = data.message ?? data.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Fetches a PDF blob (invoices) with the Bearer token attached. */
export async function apiFetchBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return await res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
