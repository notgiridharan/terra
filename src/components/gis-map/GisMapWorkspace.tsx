"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchRecords } from "@/lib/api";
import { MAP_SHAPES, GIS_CONFLICTS, type GisParcel } from "@/lib/gis-map";
import { ParcelMap } from "@/components/gis-map/ParcelMap";
import { MasterStatusBadge } from "@/components/land-records/MasterStatusBadge";

export function GisMapWorkspace() {
  const [parcels, setParcels] = useState<GisParcel[]>([]);
  const [filter, setFilter] = useState<"all" | "conflicts">("all");
  const [selectedId, setSelectedId] = useState("mlr-142-3-remain");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchRecords()
      .then((recs) => {
        if (!active) return;
        const mapped = MAP_SHAPES.map((shape) => {
          const dbRec = recs.find((r) => r.government_integration.external_gov_id === shape.parcelId);
          if (!dbRec) return null;

          const meta = (dbRec.ocr_metadata && dbRec.ocr_metadata.extra) || {};
          const history = meta.history || {};
          const conflicts = GIS_CONFLICTS[shape.parcelId] ?? [];

          return {
            id: dbRec.government_integration.external_gov_id || dbRec.id.toString(),
            owner: dbRec.output_information.owner_name || "Unknown",
            surveyNumber: dbRec.output_information.survey_no || "Unknown",
            area: dbRec.output_information.land_area_acres || "Unknown",
            village: dbRec.output_information.village || "Unknown",
            status: dbRec.government_integration.sync_status as any,
            lastUpdated: dbRec.updated_at ? new Date(dbRec.updated_at).toLocaleDateString("en-IN") : "12 Aug 2026",
            previousOwners: history.previousOwners || [],
            transactions: history.transactions || [],
            mutations: history.mutations || [],
            linkedDocuments: history.linkedDocuments || [],
            points: shape.points,
            labelX: shape.labelX,
            labelY: shape.labelY,
            conflicts,
            hasConflict: conflicts.length > 0
          };
        }).filter((x): x is GisParcel => x !== null);

        setParcels(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch records for GIS Map:", err);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible =
    filter === "conflicts" ? parcels.filter((item) => item.hasConflict) : parcels;
  const selected =
    visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  const conflictCount = parcels.filter((item) => item.hasConflict).length;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Spatial view
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">GIS map</h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Mock cadastral sheet for the Sirkazhi block. Click a parcel for survey
          number, owner, area, village, transactions, status, and conflicts.
          Hatched red parcels have conflicts.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[12px] text-tl-muted">
        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as "all" | "conflicts")
          }
          className="border border-tl-border bg-tl-panel px-3 py-2 text-[13px] text-tl-text"
        >
          <option value="all">All parcels</option>
          <option value="conflicts">Conflicts only</option>
        </select>
        <span>
          {visible.length} shown · {conflictCount} with conflicts
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 border border-tl-gold bg-tl-gold/30" />
          Clear
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 border border-red-400 bg-red-500/30" />
          Conflict
        </span>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <section className="min-w-0 flex-1 border border-tl-border bg-tl-panel">
          <div className="flex items-center justify-between border-b border-tl-border px-4 py-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-tl-muted">
              FMB sheet · mock · not georeferenced
            </p>
            <p className="text-[11px] text-tl-muted">Sirkazhi / adjoining villages</p>
          </div>
          <ParcelMap
            parcels={visible}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
          />
        </section>

        {selected ? <ParcelPanel parcel={selected} /> : null}
      </div>
    </div>
  );
}

function ParcelPanel({ parcel }: { parcel: GisParcel }) {
  return (
    <aside className="w-full shrink-0 border border-tl-border bg-tl-panel xl:w-[360px]">
      <div className="border-b border-tl-border px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
          Parcel
        </p>
        <h3 className="mt-1 text-[15px] font-semibold text-tl-text">
          Survey {parcel.surveyNumber}
        </h3>
      </div>

      <dl className="space-y-3 border-b border-tl-border px-4 py-4 text-[13px]">
        <Row label="Survey Number" value={parcel.surveyNumber} />
        <Row label="Owner" value={parcel.owner} />
        <Row label="Area" value={parcel.area} />
        <Row label="Village" value={parcel.village} />
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
            Record Status
          </dt>
          <dd className="mt-1">
            <MasterStatusBadge status={parcel.status} />
          </dd>
        </div>
      </dl>

      <div className="border-b border-tl-border px-4 py-4">
        <h4 className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
          Transactions
        </h4>
        {parcel.transactions.length === 0 ? (
          <p className="mt-2 text-[12px] text-tl-muted">None on file.</p>
        ) : (
          <ul className="mt-2 space-y-2">
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
      </div>

      <div className="px-4 py-4">
        <h4 className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
          Conflicts
        </h4>
        {parcel.conflicts.length === 0 ? (
          <p className="mt-2 text-[12px] text-tl-muted">No GIS conflicts on this parcel.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {parcel.conflicts.map((item) => (
              <li key={item.type} className="text-[13px]">
                <p className="font-medium text-red-300">
                  {item.type}
                  <span className="ml-2 text-[11px] font-normal text-tl-muted">
                    {item.severity}
                  </span>
                </p>
                <p className="text-[12px] leading-5 text-tl-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex gap-3 text-[12px]">
          <Link href="/conflicts" className="text-tl-gold hover:underline">
            Conflict queue
          </Link>
          <Link href="/land-records" className="text-tl-gold hover:underline">
            Master record
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-tl-text">{value}</dd>
    </div>
  );
}
