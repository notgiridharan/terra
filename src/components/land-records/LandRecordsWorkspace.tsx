"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchRecords } from "@/lib/api";
import {
  MASTER_STATUSES,
  type MasterParcel,
  type MasterStatus,
} from "@/lib/master-records";
import { MasterStatusBadge } from "@/components/land-records/MasterStatusBadge";

export function LandRecordsWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MasterStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    "mlr-142-3-remain",
  );
  const [allParcels, setAllParcels] = useState<MasterParcel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchRecords()
      .then((recs) => {
        if (!active) return;
        const mapped = recs
          .filter((r) => r.government_integration.external_gov_id?.startsWith("mlr-"))
          .map((r) => {
            const meta = (r.ocr_metadata && r.ocr_metadata.extra) || {};
            const history = meta.history || {};
            return {
              id: r.government_integration.external_gov_id || r.id.toString(),
              owner: r.output_information.owner_name || "Unknown",
              surveyNumber: r.output_information.survey_no || "Unknown",
              area: r.output_information.land_area_acres || "Unknown",
              village: r.output_information.village || "Unknown",
              status: r.government_integration.sync_status as any,
              lastUpdated: r.updated_at ? new Date(r.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "12 Aug 2026",
              previousOwners: history.previousOwners || [],
              transactions: history.transactions || [],
              mutations: history.mutations || [],
              linkedDocuments: history.linkedDocuments || []
            };
          });
        setAllParcels(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load records from DB:", err);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allParcels.filter((parcel) => {
      if (status !== "all" && parcel.status !== status) return false;
      if (!q) return true;
      return (
        parcel.owner.toLowerCase().includes(q) ||
        parcel.surveyNumber.toLowerCase().includes(q) ||
        parcel.village.toLowerCase().includes(q) ||
        parcel.area.toLowerCase().includes(q) ||
        parcel.status.toLowerCase().includes(q)
      );
    });
  }, [allParcels, query, status]);

  const selected =
    rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Master database
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">
          Land records
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Searchable mock master file. Open a row for previous owners,
          transactions, mutations, and linked documents. Includes the 5 acre → 1
          acre sale → 4 acre remainder chain.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search owner, survey number, village…"
          className="min-w-0 flex-1 border border-tl-border bg-tl-panel px-3 py-2 text-[13px] text-tl-text outline-none focus:border-tl-gold/50"
        />
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as MasterStatus | "all")
          }
          className="border border-tl-border bg-tl-panel px-3 py-2 text-[13px] text-tl-text"
        >
          <option value="all">All statuses</option>
          {MASTER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[12px] text-tl-muted">
        {rows.length} record{rows.length === 1 ? "" : "s"}
      </p>

      <div className="flex flex-col gap-4 xl:flex-row">
        <section className="min-w-0 flex-1 border border-tl-border bg-tl-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="border-b border-tl-border bg-tl-bg/80 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Owner</th>
                  <th className="px-4 py-2 font-medium">Survey Number</th>
                  <th className="px-4 py-2 font-medium">Area</th>
                  <th className="px-4 py-2 font-medium">Village</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-tl-muted"
                    >
                      No master records match this search.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={`cursor-pointer border-b border-tl-border/80 last:border-b-0 ${
                        selected?.id === row.id
                          ? "bg-tl-gold/10"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-tl-text">
                        {row.owner}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-tl-muted">
                        {row.surveyNumber}
                      </td>
                      <td className="px-4 py-3 text-tl-muted">{row.area}</td>
                      <td className="px-4 py-3 text-tl-muted">{row.village}</td>
                      <td className="px-4 py-3">
                        <MasterStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-tl-muted">
                        {row.lastUpdated}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected ? <HistoryPanel parcel={selected} /> : null}
      </div>
    </div>
  );
}

function HistoryPanel({ parcel }: { parcel: MasterParcel }) {
  return (
    <aside className="w-full shrink-0 border border-tl-border bg-tl-panel xl:w-[380px]">
      <div className="border-b border-tl-border px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
          Complete history
        </p>
        <h3 className="mt-1 text-[15px] font-semibold text-tl-text">
          {parcel.owner}
        </h3>
        <p className="mt-1 text-[12px] text-tl-muted">
          S.No. {parcel.surveyNumber} · {parcel.village} · {parcel.area}
        </p>
      </div>
      <div className="max-h-[720px] space-y-4 overflow-y-auto px-4 py-4">
        <Section title="Previous owners">
          {parcel.previousOwners.length === 0 ? (
            <p className="text-[12px] text-tl-muted">None on file.</p>
          ) : (
            <ul className="space-y-2">
              {parcel.previousOwners.map((owner) => (
                <li key={`${owner.name}-${owner.from}`} className="text-[13px]">
                  <p className="font-medium text-tl-text">{owner.name}</p>
                  <p className="text-[12px] text-tl-muted">
                    {owner.from} – {owner.to}
                  </p>
                  <p className="text-[12px] text-tl-muted">{owner.note}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Transactions">
          {parcel.transactions.length === 0 ? (
            <p className="text-[12px] text-tl-muted">None on file.</p>
          ) : (
            <ul className="space-y-2">
              {parcel.transactions.map((txn) => (
                <li key={`${txn.date}-${txn.instrument}`} className="text-[13px]">
                  <p className="font-medium text-tl-text">
                    {txn.type} · {txn.area}
                  </p>
                  <p className="text-[12px] text-tl-muted">
                    {txn.date}: {txn.from} → {txn.to}
                  </p>
                  <p className="text-[12px] text-tl-muted">{txn.instrument}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Mutations">
          {parcel.mutations.length === 0 ? (
            <p className="text-[12px] text-tl-muted">None on file.</p>
          ) : (
            <ul className="space-y-2">
              {parcel.mutations.map((mut) => (
                <li key={mut.number} className="text-[13px]">
                  <p className="font-medium text-tl-text">{mut.number}</p>
                  <p className="text-[12px] text-tl-muted">
                    {mut.date} · {mut.order}
                  </p>
                  <p className="text-[12px] text-tl-muted">{mut.effect}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Linked documents">
          <ul className="space-y-2">
            {parcel.linkedDocuments.map((doc) => (
              <li key={doc.title} className="text-[13px]">
                {doc.href ? (
                  <Link href={doc.href} className="text-tl-gold hover:underline">
                    {doc.title}
                  </Link>
                ) : (
                  <span className="text-tl-text">{doc.title}</span>
                )}
                <p className="text-[12px] text-tl-muted">{doc.kind}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-tl-muted">
        {title}
      </h4>
      {children}
    </section>
  );
}
