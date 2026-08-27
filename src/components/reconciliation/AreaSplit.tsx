import type { ReconciliationView } from "@/lib/reconciliation";

export function AreaSplit({ view }: { view: ReconciliationView }) {
  const original = view.originalAcres;
  const remainPct = (view.remainingAcres / original) * 100;
  const soldPct = (view.soldAcres / original) * 100;

  return (
    <section className="border border-tl-border bg-tl-panel">
      <div className="border-b border-tl-border px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Area chain
        </p>
        <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
          Original {view.originalAcres} acres → {view.soldAcres} acre sold →{" "}
          {view.remainingAcres} acres remaining
        </h3>
      </div>
      <div className="px-4 py-4">
        <div className="flex h-8 overflow-hidden border border-tl-border">
          <div
            className="flex items-center justify-center bg-emerald-500/20 text-[11px] text-emerald-200"
            style={{ width: `${remainPct}%` }}
          >
            {view.remainingAcres} ac remainder
          </div>
          <div
            className={`flex items-center justify-center text-[11px] ${
              view.saleInGovernment
                ? "bg-sky-500/20 text-sky-200"
                : "bg-tl-gold/20 text-tl-gold"
            }`}
            style={{ width: `${soldPct}%` }}
          >
            {view.soldAcres} ac sold
          </div>
        </div>
        <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
          <p className="text-tl-muted">
            Government database contains the 1 acre transaction:{" "}
            <span className="font-medium text-tl-text">
              {view.saleInGovernment ? "Yes" : "No"}
            </span>
          </p>
          <p className="text-tl-muted">
            LRMS current extent:{" "}
            <span className="font-medium text-tl-text">
              {view.governmentAcres} acres
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
