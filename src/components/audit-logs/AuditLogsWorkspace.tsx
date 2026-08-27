"use client";

import { useMemo, useState } from "react";
import {
  AUDIT_ACTORS,
  downloadComplianceCSV,
  formatAuditTime,
  searchEvents,
  SESSION_USER,
  versionsForRecord,
  type AuditActor,
  type AuditEvent,
} from "@/lib/audit";
import { useAudit } from "@/lib/audit-store";
import { ComplianceReportPrint } from "@/components/audit-logs/ComplianceReportPrint";
import { useAuth } from "@/lib/auth-store";
import { ROLE_META } from "@/lib/auth";

export function AuditLogsWorkspace() {
  const { events, versions, currentVersionId, revertToVersion, canRevert } =
    useAudit();
  const { session } = useAuth();
  const displayUser = session
    ? `${session.name} (${session.employeeId})`
    : SESSION_USER;
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState<AuditActor | "all">("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [confirmVersionId, setConfirmVersionId] = useState<string | null>(null);

  const rows = useMemo(
    () => searchEvents(events, query, actor),
    [events, query, actor],
  );

  const filterSummary = `Actor: ${actor === "all" ? "All" : actor}${query ? ` · Search: "${query}"` : ""}`;
  const selected: AuditEvent | null =
    rows.find((row) => row.id === selectedEventId) ?? rows[0] ?? null;

  const history = selected
    ? versionsForRecord(versions, selected.recordId)
    : [];
  const currentId = selected
    ? currentVersionId[selected.recordId]
    : undefined;

  function confirmRevert(versionId: string) {
    revertToVersion(versionId);
    setConfirmVersionId(null);
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
            Compliance trail
          </p>
          <h2 className="mt-1 text-lg font-semibold text-tl-text">Audit logs</h2>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
            Every AI and officer action on the pipeline. Logs are append-only.
            Revert writes a new version and a new audit row; it does not erase
            history. Session: {displayUser}.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => downloadComplianceCSV(rows, versions)}
            className="border border-tl-border px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.1em] text-tl-text hover:border-tl-gold/40 hover:text-tl-gold"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="border border-tl-gold/50 bg-tl-gold/15 px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.1em] text-tl-gold hover:bg-tl-gold/20"
          >
            Export PDF report
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search action, user, record, values…"
          className="min-w-0 flex-1 border border-tl-border bg-tl-panel px-3 py-2 text-[13px] text-tl-text outline-none focus:border-tl-gold/50"
        />
        <select
          value={actor}
          onChange={(event) =>
            setActor(event.target.value as AuditActor | "all")
          }
          className="border border-tl-border bg-tl-panel px-3 py-2 text-[13px] text-tl-text"
        >
          <option value="all">All actors</option>
          {AUDIT_ACTORS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[12px] text-tl-muted">
        {rows.length} event{rows.length === 1 ? "" : "s"}
      </p>

      <div className="flex flex-col gap-4 xl:flex-row">
        <section className="min-w-0 flex-1 border border-tl-border bg-tl-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead className="border-b border-tl-border bg-tl-bg/80 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Record</th>
                  <th className="px-4 py-2 font-medium">Old value</th>
                  <th className="px-4 py-2 font-medium">New value</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-tl-muted"
                    >
                      No audit events match this search.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedEventId(row.id)}
                      className={`cursor-pointer border-b border-tl-border/80 last:border-b-0 ${
                        selected?.id === row.id
                          ? "bg-tl-gold/10"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-tl-muted">
                        {formatAuditTime(row.at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-tl-text">{row.user}</p>
                        <p className="text-[11px] text-tl-muted">{row.actor}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-tl-text">
                        {row.action}
                      </td>
                      <td className="px-4 py-3 text-tl-muted">{row.record}</td>
                      <td className="max-w-[180px] px-4 py-3 text-[12px] text-tl-muted">
                        {row.oldValue}
                      </td>
                      <td className="max-w-[180px] px-4 py-3 text-[12px] text-tl-muted">
                        {row.newValue}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="w-full shrink-0 border border-tl-border bg-tl-panel xl:w-[380px]">
          <div className="border-b border-tl-border px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
              Version history
            </p>
            <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
              {selected ? selected.record : "Select an event"}
            </h3>
            <p className="mt-1 text-[12px] text-tl-muted">
              {history.length > 0
                ? `${history.length} version${history.length === 1 ? "" : "s"} on this record.`
                : "No stored versions for this record. Pipeline events are still logged."}
            </p>
          </div>

          {history.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-tl-muted">
              Version snapshots exist for master parcels. Document-only rows
              keep the activity log without a revert target.
            </p>
          ) : (
            <ul className="divide-y divide-tl-border">
              {history.map((item) => {
                const isCurrent = item.id === currentId;
                const waiting = confirmVersionId === item.id;

                return (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-medium text-tl-text">
                          Version {item.version}
                          {isCurrent ? (
                            <span className="ml-2 border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                              Current
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[11px] text-tl-muted">
                          {formatAuditTime(item.at)} · {item.user}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[12px] leading-5 text-tl-muted">
                      {item.summary}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-tl-text/80">
                      {item.snapshot.owner} · {item.snapshot.area} ·{" "}
                      {item.snapshot.status}
                    </p>

                    {!isCurrent && canRevert ? (
                      waiting ? (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => confirmRevert(item.id)}
                            className="border border-tl-gold/50 bg-tl-gold/15 px-2 py-1 text-[11px] font-medium text-tl-gold"
                          >
                            Confirm revert
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmVersionId(null)}
                            className="border border-tl-border px-2 py-1 text-[11px] text-tl-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmVersionId(item.id)}
                          className="mt-2 border border-tl-border px-2 py-1 text-[11px] text-tl-text hover:border-tl-gold/40 hover:text-tl-gold"
                        >
                          Revert
                        </button>
                      )
                    ) : null}

                    {!canRevert && !isCurrent ? (
                      <p className="mt-2 text-[11px] text-tl-muted">
                        Revert requires District Collector clearance (L6)
                        {session
                          ? ` — you are signed in as ${ROLE_META[session.role].title}.`
                          : "."}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      <ComplianceReportPrint
        events={rows}
        versions={versions}
        generatedAt={formatAuditTime(new Date().toISOString())}
        filterSummary={filterSummary}
        sessionUser={displayUser}
      />
    </div>
  );
}
