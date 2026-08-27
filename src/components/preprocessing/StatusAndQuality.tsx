"use client";

import type { DocumentQuality, PreprocessingState } from "@/lib/preprocessing";
import { statusDetail } from "@/lib/preprocessing";

export function StatusAndQuality({
  state,
  onRun,
}: {
  state: PreprocessingState;
  onRun: () => void;
}) {
  const busy = state.status === "Queued" || state.status === "Processing";

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="border border-tl-border bg-tl-panel">
        <div className="flex items-center justify-between border-b border-tl-border px-4 py-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
              Processing status
            </p>
            <h3 className="mt-1 text-[15px] font-semibold text-tl-text">
              {state.status}
            </h3>
          </div>
          <span className="rounded-sm border border-tl-border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
            Mock OpenCV
          </span>
        </div>
        <div className="px-4 py-4">
          <p className="text-[13px] text-tl-muted">{statusDetail(state)}</p>
          <div className="mt-4 h-1.5 bg-tl-bg">
            <div
              className="h-full bg-tl-gold transition-all"
              style={{ width: `${progressWidth(state)}%` }}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onRun}
            className="mt-4 rounded-sm border border-tl-gold/50 bg-tl-gold/15 px-3 py-2 text-[12px] font-medium uppercase tracking-[0.12em] text-tl-gold hover:bg-tl-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.status === "Complete" ? "Re-run preprocessing" : "Run preprocessing"}
          </button>
        </div>
      </div>

      <div className="border border-tl-border bg-tl-panel">
        <div className="border-b border-tl-border px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
            Document quality
          </p>
          <h3 className="mt-1 text-[15px] font-semibold text-tl-text">
            Scan assessment
          </h3>
        </div>
        <div className="grid gap-0 sm:grid-cols-2">
          <QualityBlock title="Before" quality={state.qualityBefore} />
          <QualityBlock
            title="After"
            quality={state.qualityAfter}
            emptyLabel="Run the pipeline to estimate post-process quality"
          />
        </div>
      </div>
    </section>
  );
}

function QualityBlock({
  title,
  quality,
  emptyLabel,
}: {
  title: string;
  quality: DocumentQuality | null;
  emptyLabel?: string;
}) {
  return (
    <div className="border-t border-tl-border px-4 py-4 sm:border-t-0 sm:first:border-r">
      <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
        {title}
      </p>
      {quality ? (
        <>
          <p className="mt-2 text-[22px] font-semibold tabular-nums text-tl-text">
            {quality.score}
            <span className="ml-2 text-[12px] font-medium text-tl-gold">
              {quality.label}
            </span>
          </p>
          <dl className="mt-3 space-y-1.5 text-[12px] text-tl-muted">
            <Row label="Skew" value={`${quality.skewDegrees}°`} />
            <Row label="Noise index" value={quality.noiseIndex.toFixed(2)} />
            <Row label="Contrast" value={quality.contrast.toFixed(2)} />
            <Row label="Readability" value={`${quality.readability}`} />
          </dl>
        </>
      ) : (
        <p className="mt-3 text-[13px] text-tl-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="tabular-nums text-tl-text">{value}</dd>
    </div>
  );
}

function progressWidth(state: PreprocessingState): number {
  if (state.status === "Idle") return 0;
  if (state.status === "Queued") return 8;
  if (state.status === "Complete") return 100;
  const map: Record<string, number> = {
    original: 10,
    deskew: 30,
    denoise: 50,
    enhancement: 72,
    restoration: 90,
  };
  return map[state.activeStage] ?? 20;
}
