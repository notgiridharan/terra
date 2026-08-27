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
  formatSnapshot,
  seedAuditState,
  SESSION_CAN_REVERT,
  SESSION_USER,
  type AuditState,
  type RecordVersion,
} from "@/lib/audit";

type AuditContextValue = AuditState & {
  revertToVersion: (versionId: string) => boolean;
};

const AuditContext = createContext<AuditContextValue | null>(null);

const STORAGE_KEY = "terralens.audit.v1";

function load(): AuditState {
  if (typeof window === "undefined") {
    return seedAuditState();
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return seedAuditState();
    const parsed = JSON.parse(raw) as AuditState;
    if (!parsed.events?.length || !parsed.versions?.length) {
      return seedAuditState();
    }
    return parsed;
  } catch {
    return seedAuditState();
  }
}

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuditState>(seedAuditState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const revertToVersion = useCallback((versionId: string) => {
    if (!SESSION_CAN_REVERT) return false;

    setState((current) => {
      const target = current.versions.find((item) => item.id === versionId);
      if (!target) return current;

      const currentId = current.currentVersionId[target.recordId];
      if (currentId === versionId) return current;

      const live = current.versions.find((item) => item.id === currentId);
      const siblings = current.versions.filter(
        (item) => item.recordId === target.recordId,
      );
      const nextNumber =
        siblings.reduce((max, item) => Math.max(max, item.version), 0) + 1;
      const now = new Date().toISOString();
      const newVersion: RecordVersion = {
        id: `ver-${target.recordId}-${Date.now()}`,
        recordId: target.recordId,
        recordLabel: target.recordLabel,
        version: nextNumber,
        at: now,
        user: SESSION_USER,
        summary: `Reverted to version ${target.version}.`,
        snapshot: { ...target.snapshot },
      };

      const revertEvent = {
        id: `evt-revert-${Date.now()}`,
        at: now,
        user: SESSION_USER,
        actor: "Officer" as const,
        action: "Record reverted",
        record: target.recordLabel,
        recordId: target.recordId,
        oldValue: live ? formatSnapshot(live.snapshot) : "—",
        newValue: formatSnapshot(target.snapshot),
      };
      const dbEvent = {
        id: `evt-db-${Date.now() + 1}`,
        at: now,
        user: "System",
        actor: "System" as const,
        action: "Database updated",
        record: target.recordLabel,
        recordId: target.recordId,
        oldValue: live ? formatSnapshot(live.snapshot) : "—",
        newValue: formatSnapshot(target.snapshot),
      };

      return {
        events: [dbEvent, revertEvent, ...current.events],
        versions: [...current.versions, newVersion],
        currentVersionId: {
          ...current.currentVersionId,
          [target.recordId]: newVersion.id,
        },
      };
    });

    return true;
  }, []);

  const value = useMemo(
    () => ({ ...state, revertToVersion }),
    [state, revertToVersion],
  );

  return (
    <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
  );
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) {
    throw new Error("useAudit must be used within AuditProvider");
  }
  return ctx;
}
