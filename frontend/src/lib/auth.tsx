import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch, getToken, setToken } from "./api";

export type Role = "customer" | "worker" | "admin";

export type UserProfile = {
  _id: string;
  name: string;
  role: Role;
  phone?: string | undefined;
  address?: string;
  skills?: string[];
};

type AuthResponse = { token: string; role: Role; _id: string; name: string; phone?: string; address?: string; skills?: string[] };

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  ready: boolean;
  login: (payload: { phone: string; password: string; role: string }) => Promise<Role>;
  register: (payload: Record<string, unknown>) => Promise<Role>;
  logout: () => void;
};

const USER_KEY = "sewasathi_user";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw) as UserProfile);
      setTokenState(getToken());
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((res: AuthResponse) => {
    const profile: UserProfile = {
      _id: res._id,
      name: res.name,
      role: res.role,
      phone: res.phone,
      address: res.address,
      skills: res.skills,
    };
    setToken(res.token);
    setTokenState(res.token);
    setUser(profile);
    window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
    return res.role;
  }, []);

  const login = useCallback(
    async (payload: { phone: string; password: string; role: string }) => {
      const res = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return persist(res);
    },
    [persist],
  );

  const register = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return persist(res);
    },
    [persist],
  );

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    window.localStorage.removeItem(USER_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, register, logout }),
    [user, token, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function roleHome(role: Role) {
  return role === "admin" ? "/admin" : role === "worker" ? "/worker" : "/customer";
}
