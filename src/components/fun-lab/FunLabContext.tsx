"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FunLabName } from "@/lib/fun-lab-roster";

export type FunLabState = {
  poll: Record<string, string>;
  elfVote: Record<string, string>;
  challenge: { joined: string[]; done: string[] };
  wishLikes: Record<string, string[]>;
  mine: {
    poll?: string;
    elfVote?: string;
    challenge?: { joined: boolean; done: boolean };
    wishLikes?: string[];
  };
};

type FunLabContextValue = {
  ready: boolean;
  name: FunLabName | null;
  state: FunLabState;
  error: string | null;
  login: (name: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  vote: (game: string, value: unknown) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const EMPTY_STATE: FunLabState = {
  poll: {},
  elfVote: {},
  challenge: { joined: [], done: [] },
  wishLikes: {},
  mine: {},
};

const FunLabContext = createContext<FunLabContextValue | null>(null);

export function FunLabProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [name, setName] = useState<FunLabName | null>(null);
  const [state, setState] = useState<FunLabState>(EMPTY_STATE);
  const [error, setError] = useState<string | null>(null);

  const applyPayload = (data: { name?: FunLabName | null; state?: FunLabState }) => {
    setName(data.name ?? null);
    setState(data.state ?? EMPTY_STATE);
  };

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/fun-lab/session", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; name: FunLabName | null; state: FunLabState }
        | { ok: false; error?: string }
        | null;
      if (!res.ok || !data || !("ok" in data) || !data.ok) {
        setError(data && "error" in data ? (data.error ?? null) : "Could not load Fun Lab.");
        setName(null);
        setState(EMPTY_STATE);
        return;
      }
      setError(null);
      applyPayload(data);
    } catch {
      setError("The server cannot be reached. Check your connection.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, [refresh]);

  const login = useCallback(async (loginName: string, pin: string) => {
    setError(null);
    try {
      const res = await fetch("/api/fun-lab/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: loginName, pin }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; name: FunLabName; state: FunLabState }
        | { ok: false; error?: string }
        | null;
      if (!res.ok || !data || !data.ok) {
        setError(data && "error" in data && data.error ? data.error : "Login failed.");
        return false;
      }
      applyPayload(data);
      return true;
    } catch {
      setError("The server cannot be reached. Check your connection.");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/fun-lab/session", { method: "DELETE" });
    setName(null);
    setState(EMPTY_STATE);
  }, []);

  const vote = useCallback(async (game: string, value: unknown) => {
    setError(null);
    try {
      const res = await fetch("/api/fun-lab/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, value }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; name: FunLabName; state: FunLabState }
        | { ok: false; error?: string }
        | null;
      if (!res.ok || !data || !data.ok) {
        setError(data && "error" in data && data.error ? data.error : "Vote failed.");
        return false;
      }
      applyPayload(data);
      return true;
    } catch {
      setError("The server cannot be reached. Check your connection.");
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ ready, name, state, error, login, logout, vote, refresh }),
    [ready, name, state, error, login, logout, vote, refresh],
  );

  return <FunLabContext.Provider value={value}>{children}</FunLabContext.Provider>;
}

export function useFunLab(): FunLabContextValue {
  const ctx = useContext(FunLabContext);
  if (!ctx) throw new Error("useFunLab must be used inside FunLabProvider");
  return ctx;
}
