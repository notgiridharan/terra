export const PREPROCESS_STAGES = [
  { id: "original", label: "Original Document" },
  { id: "deskew", label: "Deskew" },
  { id: "denoise", label: "Noise Removal" },
  { id: "enhancement", label: "Enhancement" },
  { id: "restoration", label: "Text Restoration" },
] as const;

export type PreprocessStageId = (typeof PREPROCESS_STAGES)[number]["id"];

export type PreprocessRunStatus =
  | "Idle"
  | "Queued"
  | "Processing"
  | "Complete";

export type QualityLabel = "Poor" | "Fair" | "Good" | "Excellent";

export type DocumentQuality = {
  score: number;
  label: QualityLabel;
  skewDegrees: number;
  noiseIndex: number;
  contrast: number;
  readability: number;
};

export type PreprocessingState = {
  status: PreprocessRunStatus;
  activeStage: PreprocessStageId;
  completedStages: PreprocessStageId[];
  qualityBefore: DocumentQuality;
  qualityAfter: DocumentQuality | null;
  /** Real per-stage image URLs returned by the OpenCV backend (absent while running the simulated fallback). */
  stageUrls?: Partial<Record<PreprocessStageId, string>>;
  /** Which pipeline actually produced this state — real OpenCV or the simulated CSS-filter fallback (used for PDFs). */
  engine?: "opencv" | "mock";
};

export const PROCESS_STEPS: PreprocessStageId[] = [
  "deskew",
  "denoise",
  "enhancement",
  "restoration",
];

export const STAGE_FILTERS: Record<PreprocessStageId, string> = {
  original: "rotate(-2.6deg) contrast(0.8) brightness(0.86) saturate(0.65)",
  deskew: "rotate(0deg) contrast(0.84) brightness(0.9) saturate(0.75)",
  denoise: "contrast(1.04) brightness(0.96) saturate(0.88)",
  enhancement: "contrast(1.2) brightness(1.05) saturate(0.95)",
  restoration: "grayscale(0.28) contrast(1.4) brightness(1.1)",
};

function hashName(name: string): number {
  return Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function qualityLabel(score: number): QualityLabel {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function mockQualityBefore(name: string): DocumentQuality {
  const hash = hashName(name);
  const score = 38 + (hash % 24);
  return {
    score,
    label: qualityLabel(score),
    skewDegrees: round(2.1 + (hash % 28) / 10),
    noiseIndex: round(0.42 + (hash % 30) / 100, 2),
    contrast: round(0.32 + (hash % 22) / 100, 2),
    readability: 40 + (hash % 18),
  };
}

export function mockQualityAfter(before: DocumentQuality): DocumentQuality {
  const score = Math.min(96, before.score + 28 + (before.score % 7));
  return {
    score,
    label: qualityLabel(score),
    skewDegrees: round(Math.max(0.1, before.skewDegrees * 0.08)),
    noiseIndex: round(Math.max(0.06, before.noiseIndex * 0.18), 2),
    contrast: round(Math.min(0.94, before.contrast + 0.38), 2),
    readability: Math.min(97, before.readability + 32),
  };
}

export function idlePreprocessing(name: string): PreprocessingState {
  return {
    status: "Idle",
    activeStage: "original",
    completedStages: ["original"],
    qualityBefore: mockQualityBefore(name),
    qualityAfter: null,
  };
}

export function stageLabel(id: PreprocessStageId): string {
  return PREPROCESS_STAGES.find((stage) => stage.id === id)?.label ?? id;
}

export function statusDetail(state: PreprocessingState): string {
  const engineLabel = state.engine === "mock" ? "simulated" : "OpenCV";
  if (state.status === "Idle") return "OpenCV pipeline not started";
  if (state.status === "Queued") return `Queued for ${engineLabel} preprocessing`;
  if (state.status === "Processing") {
    return `Running ${stageLabel(state.activeStage)} (${engineLabel})`;
  }
  return state.engine === "mock"
    ? "Simulated preprocessing complete — real OpenCV pipeline only supports raster images, not PDFs"
    : "OpenCV preprocessing complete";
}
