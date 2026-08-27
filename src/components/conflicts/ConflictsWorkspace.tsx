"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDocuments } from "@/lib/documents-store";
import {
  ASSIGNABLE_OFFICERS,
  CONFLICT_TYPES,
  listConflicts,
  type ConflictType,
} from "@/lib/conflicts";
import {
  getAction,
  useConflictActions,
} from "@/lib/conflicts-store";
import {
  ConflictStatusBadge,
  SeverityBadge,
} from "@/components/conflicts/ConflictBadges";

export function ConflictsWorkspace() {
  const { documents } = useDocuments();
  const { actions, setStatus, assignOfficer } = useConflictActions();
  const [typeFilter, setTypeFilter] = useState<ConflictType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const conflicts = useMemo(() => listConflicts(documents), [documents]);
  const visible = conflicts.filter(
    (item) => typeFilter === "all" || item.type === typeFilter,
  );
  const selected =
    visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;

  const counts = CONFLICT_TYPES.map((type) => ({
    type,
    count: conflicts.filter((item) => item.type === type).length,
  }));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Pipeline · Conflict queue
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">Conflicts</h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Issues raised from mock reconciliation of historical documents against
          government records. Officer actions are recorded in this session only.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={typeFilter === "all"}
          onClick={() => setTypeFilter("all")}
          label={`All ${conflicts.length}`}
        />
        {counts.map((item) => (
          <FilterChip
            key={item.type}
            active={typeFilter === item.type}
            onClick={() => setTypeFilter(item.type)}
            label={`${item.type} ${item.count}`}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="border border-tl-border bg-tl-panel px-5 py-10 text-sm text-tl-muted">
          No conflicts in this filter. MATCH records do not appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-4 xl:flex-row">
          <section className="min-w-0 flex-1 border border-tl-border bg-tl-panel">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-[13px]">
                <thead className="border-b border-tl-border bg-tl-bg/80 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Severity</th>
                    <th className="px-3 py-2 font-medium">Record</th>
                    <th className="px-3 py-2 font-medium">Conflicting values</th>
                    <th className="px-3 py-2 font-medium">Reason</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => {
                    const action = getAction(actions, item.id);
                    const active = selected?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer border-b border-tl-border/80 last:border-b-0 ${
                          active ? "bg-tl-gold/10" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <td className="px-3 py-3 font-medium text-tl-text">
                          {item.type}
                        </td>
                        <td className="px-3 py-3">
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td className="max-w-[220px] px-3 py-3 text-tl-muted">
                          {item.recordName}
                        </td>
                        <td className="max-w-[240px] px-3 py-3 text-[12px] text-tl-muted">
                          <p>Hist: {item.historicalValue}</p>
                          <p className="mt-1">Gov: {item.governmentValue}</p>
                        </td>
                        <td className="max-w-[280px] px-3 py-3 text-[12px] text-tl-muted">
                          {item.reason}
                        </td>
                        <td className="px-3 py-3">
                          <ConflictStatusBadge status={action.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {selected ? (
            <aside className="w-full shrink-0 border border-tl-border bg-tl-panel xl:w-[340px]">
              <div className="border-b border-tl-border px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
                  Selected conflict
                </p>
                <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
                  {selected.type}
                </h3>
              </div>
              <div className="space-y-3 px-4 py-4 text-[13px]">
                <p className="text-tl-muted">{selected.recordName}</p>
                <div className="flex gap-2">
                  <SeverityBadge severity={selected.severity} />
                  <ConflictStatusBadge
                    status={getAction(actions, selected.id).status}
                  />
                </div>
                <Field label="Historical" value={selected.historicalValue} />
                <Field label="Government" value={selected.governmentValue} />
                <Field label="Reason" value={selected.reason} />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                    Evidence
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] text-tl-muted">
                    {selected.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                {getAction(actions, selected.id).assignedOfficer ? (
                  <p className="text-[12px] text-tl-gold">
                    Assigned: {getAction(actions, selected.id).assignedOfficer}
                  </p>
                ) : null}

                <div className="flex flex-col gap-2 border-t border-tl-border pt-3">
                  <button
                    type="button"
                    onClick={() => setStatus(selected.id, "In review")}
                    className="border border-tl-border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-tl-muted hover:text-tl-text"
                  >
                    Review
                  </button>
                  <Link
                    href={`/reconciliation?doc=${selected.documentId}`}
                    className="border border-tl-border px-3 py-1.5 text-center text-[11px] uppercase tracking-[0.12em] text-tl-muted hover:text-tl-text"
                  >
                    Compare
                  </Link>
                  <label className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                    Assign Officer
                    <select
                      className="mt-1 w-full border border-tl-border bg-tl-bg px-2 py-1.5 text-[12px] text-tl-text"
                      value={getAction(actions, selected.id).assignedOfficer ?? ""}
                      onChange={(event) => {
                        if (event.target.value) {
                          assignOfficer(selected.id, event.target.value);
                        }
                      }}
                    >
                      <option value="">Select officer</option>
                      {ASSIGNABLE_OFFICERS.map((officer) => (
                        <option key={officer} value={officer}>
                          {officer}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setStatus(selected.id, "Resolved")}
                    className="border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-emerald-300"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(selected.id, "Escalated")}
                    className="border border-red-500/35 bg-red-500/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-red-300"
                  >
                    Escalate
                  </button>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-2 py-1 text-[11px] ${
        active
          ? "border-tl-gold/50 bg-tl-gold/10 text-tl-text"
          : "border-tl-border text-tl-muted"
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
        {label}
      </p>
      <p className="mt-1 text-tl-text">{value}</p>
    </div>
  );
}
