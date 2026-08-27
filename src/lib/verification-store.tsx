"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { OfficerAction } from "@/lib/verification";

export type ActivityEntry = {
  id: string;
  at: string;
  actor: "System" | "AI" | "Officer";
  title: string;
  detail: string;
};

export type CaseDecision = {
  action: OfficerAction;
  remarks: string;
  at: string;
};

type VerificationState = {
  decisions: Record<string, CaseDecision>;
  activity: Record<string, ActivityEntry[]>;
};

type VerificationContextValue = VerificationState & {
  recordAction: (
    documentId: string,
    action: OfficerAction,
    remarks: string,
    extra?: ActivityEntry[],
  ) => void;
  prependActivity: (documentId: string, entries: ActivityEntry[]) => void;
};

const VerificationContext = createContext<VerificationContextValue | null>(null);

const STORAGE_KEY = "terralens.verification.v1";

function load(): VerificationState {
  if (typeof window === "undefined") {
    return { decisions: {}, activity: {} };
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { decisions: {}, activity: {} };
    return JSON.parse(raw) as VerificationState;
  } catch {
    return { decisions: {}, activity: {} };
  }
}

export function seedPipelineActivity(documentId: string, name: string): ActivityEntry[] {
  return [
    {
      id: `${documentId}-ingest`,
      at: "08:10",
      actor: "System",
      title: "Document ingested",
      detail: name,
    },
    {
      id: `${documentId}-cls`,
      at: "08:12",
      actor: "AI",
      title: "Classification complete",
      detail: "Mock document-type prediction posted.",
    },
    {
      id: `${documentId}-ocr`,
      at: "08:14",
      actor: "AI",
      title: "OCR / structuring",
      detail: "Mock OCR text and structured record assembled.",
    },
    {
      id: `${documentId}-val`,
      at: "08:15",
      actor: "System",
      title: "Validation run",
      detail: "Business-rule checks completed.",
    },
    {
      id: `${documentId}-rec`,
      at: "08:16",
      actor: "AI",
      title: "Reconciliation vs LRMS",
      detail: "Historical chain compared with mock government holdings.",
    },
    {
      id: `${documentId}-rec-note`,
      at: "08:16",
      actor: "AI",
      title: "Recommendation posted",
      detail: "AI recommendation is advisory. Officer must decide.",
    },
  ];
}

export function VerificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VerificationState>({
    decisions: {},
    activity: {},
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const prependActivity = useCallback(
    (documentId: string, entries: ActivityEntry[]) => {
      setState((current) => {
        if (current.activity[documentId]?.length) return current;
        return {
          ...current,
          activity: { ...current.activity, [documentId]: entries },
        };
      });
    },
    [],
  );

  const recordAction = useCallback(
    (
      documentId: string,
      action: OfficerAction,
      remarks: string,
      extra: ActivityEntry[] = [],
    ) => {
      const entry: ActivityEntry = {
        id: `${documentId}-${action}-${Date.now()}`,
        at: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        actor: "Officer",
        title: `Decision: ${action}`,
        detail: remarks || "No remarks entered.",
      };
      setState((current) => ({
        decisions: {
          ...current.decisions,
          [documentId]: { action, remarks, at: entry.at },
        },
        activity: {
          ...current.activity,
          [documentId]: [
            entry,
            ...extra,
            ...(current.activity[documentId] ?? []),
          ],
        },
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      recordAction,
      prependActivity,
    }),
    [prependActivity, recordAction, state],
  );

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification() {
  const ctx = useContext(VerificationContext);
  if (!ctx) {
    throw new Error("useVerification must be used within VerificationProvider");
  }
  return ctx;
}
