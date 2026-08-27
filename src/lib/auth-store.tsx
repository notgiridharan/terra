"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authenticateOfficer,
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
  type OfficerSession,
} from "@/lib/auth";

type AuthContextValue = {
  session: OfficerSession | null;
  ready: boolean;
  login: (
    employeeId: string,
    password: string,
    remember: boolean,
  ) => { ok: true } | { ok: false; message: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<OfficerSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSessionCookie());
    setReady(true);
  }, []);

  const login = useCallback(
    (employeeId: string, password: string, remember: boolean) => {
      if (!employeeId.trim() || !password) {
        return {
          ok: false as const,
          message: "Enter Official ID and password.",
        };
      }
      const officer = authenticateOfficer(employeeId, password);
      if (!officer) {
        return {
          ok: false as const,
          message: "Invalid credentials. Access is restricted to authorised officers.",
        };
      }
      writeSessionCookie(officer, remember);
      setSession(officer);
      return { ok: true as const };
    },
    [],
  );

  const logout = useCallback(() => {
    clearSessionCookie();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, login, logout }),
    [session, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
