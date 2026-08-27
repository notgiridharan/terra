"use client";

import {
  PREPROCESS_STAGES,
  type PreprocessStageId,
  type PreprocessingState,
} from "@/lib/preprocessing";

export function PipelineStepper({
  state,
  viewStage,
  onSelect,
}: {
  state: PreprocessingState;
  viewStage: PreprocessStageId;
  onSelect: (stage: PreprocessStageId) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 border border-tl-border bg-tl-panel px-4 py-3">
      {PREPROCESS_STAGES.map((stage, index) => {
        const done = state.completedStages.includes(stage.id);
        const active = state.status === "Processing" && state.activeStage === stage.id;
        const selected = viewStage === stage.id;
        const selectable = done || stage.id === "original";

        return (
          <li key={stage.id} className="flex items-center gap-2">
            {index > 0 ? (
              <span className="text-[11px] text-tl-muted" aria-hidden>
                →
              </span>
            ) : null}
            <button
              type="button"
              disabled={!selectable}
              onClick={() => onSelect(stage.id)}
              className={`border px-2.5 py-1.5 text-left ${
                selected
                  ? "border-tl-gold/50 bg-tl-gold/10"
                  : "border-tl-border"
              } ${!selectable ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                {active ? "Running" : done ? "Done" : "Pending"}
              </p>
              <p className="text-[12px] font-medium text-tl-text">
                {stage.label}
              </p>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
