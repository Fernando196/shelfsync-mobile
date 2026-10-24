import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  getProfile,
  OperatorProfile,
  hasAccessToken,
  resetSession as clearLocalSession,
  setUnauthorizedHandler,
} from "../lib/auth";

interface SessionState {
  loading: boolean;
  hasToken: boolean;
  profile: OperatorProfile | null;
  refreshProfile: () => Promise<void>;
  refreshToken: () => Promise<void>;
  resetSession: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [profile, setProfile] = useState<OperatorProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    setProfile(await getProfile());
  }, []);

  const refreshToken = useCallback(async () => {
    setHasToken(await hasAccessToken());
  }, []);

  const resetSession = useCallback(async () => {
    await clearLocalSession();
    setProfile(null);
    setHasToken(false);
  }, []);

  useEffect(() => {
    Promise.all([refreshProfile(), refreshToken()]).finally(() => setLoading(false));
  }, [refreshProfile, refreshToken]);

  // Si el backend responde 401 (token invalido/vencido) en cualquier
  // llamada, se cierra la sesion local y la app vuelve a LoginScreen sola.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [resetSession]);

  const value = useMemo(
    () => ({
      loading,
      hasToken,
      profile,
      refreshProfile,
      refreshToken,
      resetSession,
    }),
    [loading, hasToken, profile, refreshProfile, refreshToken, resetSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider");
  return ctx;
}
