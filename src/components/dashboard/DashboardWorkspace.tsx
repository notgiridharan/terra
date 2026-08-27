import { BackendStatus } from "@/components/dashboard/BackendStatus";
import Link from "next/link";
import {
  CONFLICT_BREAKDOWN,
  DASHBOARD_KPIS,
  OFFICER_WORKLOAD,
  PIPELINE_STAGES,
  RECENT_ACTIVITY,
  THROUGHPUT,
} from "@/lib/dashboard";

export function DashboardWorkspace() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Operations overview
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">Dashboard</h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Mock district load for {THROUGHPUT.district}. Figures are illustrative
          and are not live pipeline counts.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {DASHBOARD_KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="border border-tl-border bg-tl-panel px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
              {kpi.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-tl-text">
              {kpi.value}
            </p>
            <p className="mt-1 text-[12px] text-tl-muted">{kpi.hint}</p>
          </div>
        ))}
      </section>

      <BackendStatus />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="border border-tl-border bg-tl-panel xl:col-span-2">
          <header className="border-b border-tl-border px-4 py-3">
            <h3 className="text-[13px] font-semibold text-tl-text">
              Pipeline
            </h3>
          </header>
          <table className="w-full text-left text-[13px]">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">Records</th>
                <th className="px-4 py-2 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {PIPELINE_STAGES.map((row) => (
                <tr key={row.stage} className="border-t border-tl-border/80">
                  <td className="px-4 py-2 text-tl-text">{row.stage}</td>
                  <td className="px-4 py-2 tabular-nums text-tl-muted">
                    {row.count}
                  </td>
                  <td className="px-4 py-2 text-tl-muted">{row.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border border-tl-border bg-tl-panel">
          <header className="border-b border-tl-border px-4 py-3">
            <h3 className="text-[13px] font-semibold text-tl-text">
              Throughput
            </h3>
          </header>
          <dl className="space-y-3 px-4 py-4 text-[13px]">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                Mean extraction confidence
              </dt>
              <dd className="mt-0.5 text-tl-text">{THROUGHPUT.meanConfidence}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                Records processed today
              </dt>
              <dd className="mt-0.5 text-tl-text">{THROUGHPUT.recordsToday}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                Avg. officer verify time
              </dt>
              <dd className="mt-0.5 text-tl-text">
                {THROUGHPUT.avgVerifyMinutes} min
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                Watch item
              </dt>
              <dd className="mt-0.5 text-[12px] leading-5 text-tl-muted">
                {THROUGHPUT.watch}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="border border-tl-border bg-tl-panel">
          <header className="flex items-center justify-between border-b border-tl-border px-4 py-3">
            <h3 className="text-[13px] font-semibold text-tl-text">
              Conflicts by type
            </h3>
            <Link href="/conflicts" className="text-[12px] text-tl-gold hover:underline">
              Open queue
            </Link>
          </header>
          <table className="w-full text-left text-[13px]">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Count</th>
                <th className="px-4 py-2 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {CONFLICT_BREAKDOWN.map((row) => (
                <tr key={row.type} className="border-t border-tl-border/80">
                  <td className="px-4 py-2 text-tl-text">{row.type}</td>
                  <td className="px-4 py-2 tabular-nums text-tl-muted">
                    {row.count}
                  </td>
                  <td className="px-4 py-2 text-tl-muted">{row.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border border-tl-border bg-tl-panel">
          <header className="border-b border-tl-border px-4 py-3">
            <h3 className="text-[13px] font-semibold text-tl-text">
              Officer workload
            </h3>
          </header>
          <table className="w-full text-left text-[13px]">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Officer</th>
                <th className="px-4 py-2 font-medium">Pending</th>
                <th className="px-4 py-2 font-medium">Conflicts</th>
              </tr>
            </thead>
            <tbody>
              {OFFICER_WORKLOAD.map((row) => (
                <tr key={row.id} className="border-t border-tl-border/80">
                  <td className="px-4 py-2">
                    <p className="text-tl-text">{row.name}</p>
                    <p className="text-[11px] text-tl-muted">
                      {row.id} · {row.office}
                    </p>
                  </td>
                  <td className="px-4 py-2 tabular-nums text-tl-muted">
                    {row.pending}
                  </td>
                  <td className="px-4 py-2 tabular-nums text-tl-muted">
                    {row.conflicts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="border border-tl-border bg-tl-panel">
        <header className="border-b border-tl-border px-4 py-3">
          <h3 className="text-[13px] font-semibold text-tl-text">
            Recent ingest and exceptions
          </h3>
        </header>
        <ul className="divide-y divide-tl-border">
          {RECENT_ACTIVITY.map((row) => (
            <li key={row.item + row.time} className="flex gap-4 px-4 py-3 text-[13px]">
              <span className="w-12 shrink-0 tabular-nums text-tl-muted">
                {row.time}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-tl-text">{row.item}</p>
                <p className="text-[12px] text-tl-muted">{row.event}</p>
              </div>
              <Link
                href={row.href}
                className="shrink-0 text-[12px] text-tl-gold hover:underline"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
