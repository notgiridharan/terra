import type { TimelineEvent } from "@/lib/reconciliation";

export function OwnershipTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="border border-tl-border bg-tl-panel">
      <div className="border-b border-tl-border px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Ownership / transaction timeline
        </p>
        <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
          Historical chain vs government posting
        </h3>
      </div>
      <ol className="relative px-4 py-5">
        <div
          className="absolute top-5 bottom-5 left-[27px] w-px bg-tl-border"
          aria-hidden
        />
        {events.map((event) => (
          <li key={event.id} className="relative mb-5 flex gap-4 last:mb-0">
            <div
              className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border ${
                event.inHistorical && event.inGovernment
                  ? "border-emerald-400 bg-emerald-400"
                  : event.inHistorical
                    ? "border-tl-gold bg-tl-gold"
                    : "border-sky-400 bg-sky-400"
              }`}
            />
            <div className="min-w-0 flex-1 border border-tl-border bg-tl-bg/60 px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13px] font-medium text-tl-text">
                  {event.title}
                </p>
                <p className="text-[11px] tabular-nums text-tl-muted">
                  {event.dateLabel}
                </p>
              </div>
              <p className="mt-1 text-[12px] text-tl-muted">
                {event.party} · {event.acres} acre{event.acres === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-[12px] text-tl-muted">{event.note}</p>
              <p className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em]">
                {event.inHistorical ? (
                  <span className="border border-tl-gold/40 px-1.5 py-0.5 text-tl-gold">
                    Historical document
                  </span>
                ) : null}
                {event.inGovernment ? (
                  <span className="border border-sky-500/35 px-1.5 py-0.5 text-sky-300">
                    Government DB
                  </span>
                ) : (
                  <span className="border border-red-500/35 px-1.5 py-0.5 text-red-300">
                    Not in government DB
                  </span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
