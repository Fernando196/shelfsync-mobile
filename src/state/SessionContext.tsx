import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  getProfile,
  OperatorProfile,
  hasAccessToken,
  hasPin as checkHasPin,
  resetSession as clearLocalSession,
  setUnauthorizedHandler,
} from "../lib/auth";

interface SessionState {
  loading: boolean;
  hasToken: boolean;
  profile: OperatorProfile | null;
  hasPin: boolean;
  unlocked: boolean;
  refreshProfile: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshPin: () => Promise<void>;
  unlock: () => void;
  lock: () => void;
  resetSession: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const refreshProfile = useCallback(async () => {
    setProfile(await getProfile());
  }, []);

  const refreshToken = useCallback(async () => {
    setHasToken(await hasAccessToken());
  }, []);

  const refreshPin = useCallback(async () => {
    setHasPin(await checkHasPin());
  }, []);

  const resetSession = useCallback(async () => {
    await clearLocalSession();
    setProfile(null);
    setUnlocked(false);
    setHasToken(false);
    setHasPin(false);
  }, []);

  useEffect(() => {
    Promise.all([refreshProfile(), refreshToken(), refreshPin()]).finally(() => setLoading(false));
  }, [refreshProfile, refreshToken, refreshPin]);

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
      hasPin,
      unlocked,
      refreshProfile,
      refreshToken,
      refreshPin,
      unlock: () => setUnlocked(true),
      lock: () => setUnlocked(false),
      resetSession,
    }),
    [loading, hasToken, profile, hasPin, unlocked, refreshProfile, refreshToken, refreshPin, resetSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider");
  return ctx;
}
