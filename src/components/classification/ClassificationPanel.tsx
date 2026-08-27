"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  formatConfidence,
  type RecordType,
} from "@/lib/classification";
import type { LandDocument } from "@/lib/documents";
import { useDocuments } from "@/lib/documents-store";

export function ClassificationPanel({ document: doc }: { document: LandDocument }) {
  const { acceptClassification, sendForManualReview } = useDocuments();
  const [selectedType, setSelectedType] = useState<RecordType>(
    doc.classification.predictedType,
  );

  useEffect(() => {
    setSelectedType(doc.classification.predictedType);
  }, [doc.id, doc.classification.predictedType]);

  const { classification } = doc;
  const locked = classification.decision !== "pending";
  const confidenceWidth = Math.min(classification.confidence, 100);

  return (
    <section className="flex w-full flex-col border border-tl-border bg-tl-panel lg:w-[340px] lg:shrink-0">
      <div className="border-b border-tl-border px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Mock AI result
        </p>
        <h2 className="mt-1 text-[14px] font-semibold text-tl-text">
          Classification
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4">
        <Field label="Predicted type">
          <p className="text-[18px] font-semibold tracking-wide text-tl-text">
            {classification.predictedType}
          </p>
        </Field>

        <Field label="Confidence">
          <div className="flex items-baseline justify-between">
            <span className="text-[18px] font-semibold tabular-nums text-tl-text">
              {formatConfidence(classification.confidence)}
            </span>
            <span className="text-[11px] text-tl-muted">
              {classification.confidence >= 85
                ? "High"
                : classification.confidence >= 70
                  ? "Moderate"
                  : "Low"}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-tl-bg">
            <div
              className="h-full bg-tl-gold"
              style={{ width: `${confidenceWidth}%` }}
            />
          </div>
        </Field>

        <Field label="Detected language">
          <p className="text-[14px] text-tl-text">{classification.language}</p>
        </Field>

        <Field label="Alternative types">
          <ul className="space-y-1">
            <AlternativeRow
              type={classification.predictedType}
              confidence={classification.confidence}
              selected={selectedType === classification.predictedType}
              disabled={locked}
              onSelect={() => setSelectedType(classification.predictedType)}
              primary
            />
            {(classification.alternatives || []).map((alt) => (
              <AlternativeRow
                key={alt.type}
                type={alt.type}
                confidence={alt.confidence}
                selected={selectedType === alt.type}
                disabled={locked}
                onSelect={() => setSelectedType(alt.type)}
              />
            ))}
          </ul>
        </Field>

        {classification.decision === "accepted" ? (
          <p className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
            Classification accepted as {classification.predictedType}.
          </p>
        ) : null}
        {classification.decision === "manual_review" ? (
          <p className="border border-tl-gold/30 bg-tl-gold/10 px-3 py-2 text-[12px] text-tl-gold">
            Sent for manual review. An officer must confirm the type.
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <button
            type="button"
            disabled={locked}
            onClick={() => acceptClassification(doc.id, selectedType)}
            className="rounded-sm border border-tl-gold/50 bg-tl-gold/15 px-3 py-2 text-[12px] font-medium uppercase tracking-[0.12em] text-tl-gold hover:bg-tl-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Accept Classification
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => sendForManualReview(doc.id)}
            className="rounded-sm border border-tl-border px-3 py-2 text-[12px] font-medium uppercase tracking-[0.12em] text-tl-muted hover:border-tl-gold/30 hover:text-tl-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send for Manual Review
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-tl-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function AlternativeRow({
  type,
  confidence,
  selected,
  disabled,
  onSelect,
  primary,
}: {
  type: RecordType;
  confidence: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  primary?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={`flex w-full items-center justify-between border px-2.5 py-1.5 text-left text-[12px] ${
          selected
            ? "border-tl-gold/50 bg-tl-gold/10 text-tl-text"
            : "border-tl-border text-tl-muted hover:text-tl-text"
        } disabled:cursor-not-allowed`}
      >
        <span>
          {type}
          {primary ? (
            <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-tl-gold">
              Top
            </span>
          ) : null}
        </span>
        <span className="tabular-nums">{formatConfidence(confidence)}</span>
      </button>
    </li>
  );
}
