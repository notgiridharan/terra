"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ConflictStatus } from "@/lib/conflicts";

type ActionState = {
  status: ConflictStatus;
  assignedOfficer: string | null;
};

type ConflictsActionsValue = {
  actions: Record<string, ActionState>;
  setStatus: (id: string, status: ConflictStatus) => void;
  assignOfficer: (id: string, officer: string) => void;
  resolveForDocument: (conflictIds: string[]) => void;
};

const ConflictsActionsContext = createContext<ConflictsActionsValue | null>(
  null,
);

const STORAGE_KEY = "terralens.conflicts.actions.v1";

function load(): Record<string, ActionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ActionState>) : {};
  } catch {
    return {};
  }
}

export function ConflictsActionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [actions, setActions] = useState<Record<string, ActionState>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setActions(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  }, [actions, hydrated]);

  const setStatus = useCallback((id: string, status: ConflictStatus) => {
    setActions((current) => ({
      ...current,
      [id]: {
        status,
        assignedOfficer: current[id]?.assignedOfficer ?? null,
      },
    }));
  }, []);

  const assignOfficer = useCallback((id: string, officer: string) => {
    setActions((current) => ({
      ...current,
      [id]: {
        status: "Assigned",
        assignedOfficer: officer,
      },
    }));
  }, []);

  const resolveForDocument = useCallback((conflictIds: string[]) => {
      setActions((current) => {
        const next = { ...current };
        for (const id of conflictIds) {
          next[id] = {
            status: "Resolved",
            assignedOfficer: current[id]?.assignedOfficer ?? "R. Venkatesh (RO-4821)",
          };
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ actions, setStatus, assignOfficer, resolveForDocument }),
    [actions, assignOfficer, resolveForDocument, setStatus],
  );

  return (
    <ConflictsActionsContext.Provider value={value}>
      {children}
    </ConflictsActionsContext.Provider>
  );
}

export function useConflictActions() {
  const ctx = useContext(ConflictsActionsContext);
  if (!ctx) {
    throw new Error("useConflictActions must be used within ConflictsActionsProvider");
  }
  return ctx;
}

export function getAction(
  actions: Record<string, ActionState>,
  id: string,
): ActionState {
  return actions[id] ?? { status: "Open", assignedOfficer: null };
}
