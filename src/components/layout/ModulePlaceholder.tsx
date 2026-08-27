export function ModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="border border-tl-border bg-tl-panel">
        <div className="flex items-center justify-between border-b border-tl-border px-5 py-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
              Workspace
            </p>
            <h2 className="mt-1 text-lg font-semibold text-tl-text">{title}</h2>
          </div>
          <span className="rounded-sm border border-tl-border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
            Not connected
          </span>
        </div>
        <div className="px-5 py-8">
          <p className="max-w-2xl text-sm leading-6 text-tl-muted">{description}</p>
          <p className="mt-6 text-[12px] uppercase tracking-[0.16em] text-tl-gold/80">
            Navigation shell only — module functions will be added later
          </p>
        </div>
      </div>
    </section>
  );
}
