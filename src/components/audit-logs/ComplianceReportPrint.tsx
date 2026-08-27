import {
  extractConfidence,
  formatAuditTime,
  type AuditEvent,
  type RecordVersion,
} from "@/lib/audit";

/**
 * Print-only compliance report. Invisible on screen; rendered full-page when
 * the browser print dialog opens (see the `@media print` rule in
 * globals.css that hides the rest of the app chrome). Officers use their
 * browser's "Save as PDF" destination to export this as a PDF file.
 */
export function ComplianceReportPrint({
  events,
  versions,
  generatedAt,
  filterSummary,
  sessionUser,
}: {
  events: AuditEvent[];
  versions: RecordVersion[];
  generatedAt: string;
  filterSummary: string;
  sessionUser: string;
}) {
  const aiEvents = events.filter((e) => e.actor === "AI");
  const officerEvents = events.filter((e) => e.actor === "Officer");
  const confidenceRows = events
    .map((event) => ({ event, confidence: extractConfidence(event) }))
    .filter((row): row is { event: AuditEvent; confidence: number } => row.confidence !== null);
  const avgConfidence =
    confidenceRows.length > 0
      ? Math.round(
          confidenceRows.reduce((sum, row) => sum + row.confidence, 0) / confidenceRows.length,
        )
      : null;

  return (
    <div className="compliance-report hidden print:block print:bg-white print:p-8 print:text-black">
      <header className="mb-6 border-b-2 border-black pb-3">
        <p className="text-[10px] uppercase tracking-[0.2em]">
          TerraLens · Compliance Export
        </p>
        <h1 className="mt-1 text-xl font-semibold">
          Audit Log Compliance Report
        </h1>
        <p className="mt-1 text-[11px]">
          Generated {generatedAt} by {sessionUser}
        </p>
        <p className="text-[11px]">Filters applied: {filterSummary}</p>
      </header>

      <section className="mb-6 grid grid-cols-5 gap-2 text-[11px]">
        <Stat label="Total events" value={events.length} />
        <Stat label="AI actions" value={aiEvents.length} />
        <Stat label="Officer decisions" value={officerEvents.length} />
        <Stat label="Record versions" value={versions.length} />
        <Stat
          label="Avg. AI confidence"
          value={avgConfidence !== null ? `${avgConfidence}%` : "n/a"}
        />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-[13px] font-semibold">
          Event log — officer decisions, AI actions, system updates
        </h2>
        <table className="w-full border-collapse text-[9.5px]">
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>User</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Record</Th>
              <Th>Old value</Th>
              <Th>New value</Th>
              <Th>AI confidence</Th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const confidence = extractConfidence(event);
              return (
                <tr key={event.id} className="break-inside-avoid">
                  <Td>{formatAuditTime(event.at)}</Td>
                  <Td>{event.user}</Td>
                  <Td>{event.actor}</Td>
                  <Td>{event.action}</Td>
                  <Td>{event.record}</Td>
                  <Td>{event.oldValue}</Td>
                  <Td>{event.newValue}</Td>
                  <Td>{confidence !== null ? `${confidence}%` : "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold">
          Record edit history — versioned snapshots
        </h2>
        <table className="w-full border-collapse text-[9.5px]">
          <thead>
            <tr>
              <Th>Record</Th>
              <Th>Ver.</Th>
              <Th>Time</Th>
              <Th>User</Th>
              <Th>Owner</Th>
              <Th>Area</Th>
              <Th>Status</Th>
              <Th>Summary</Th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id} className="break-inside-avoid">
                <Td>{v.recordLabel}</Td>
                <Td>{v.version}</Td>
                <Td>{formatAuditTime(v.at)}</Td>
                <Td>{v.user}</Td>
                <Td>{v.snapshot.owner}</Td>
                <Td>{v.snapshot.area}</Td>
                <Td>{v.snapshot.status}</Td>
                <Td>{v.summary}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-6 text-[9.5px]">
        TerraLens — Land Record Intelligence Platform. This report reflects an
        append-only audit trail; entries cannot be edited or deleted
        retroactively. A record revert creates a new version and a new audit
        row rather than modifying history.
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-black px-2 py-1.5">
      <p className="uppercase tracking-[0.1em]">{label}</p>
      <p className="text-[14px] font-semibold">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-black px-1.5 py-1 text-left font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-black px-1.5 py-1">{children}</td>;
}
