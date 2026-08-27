"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { API_BASE } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Lang = "auto" | "ta" | "en" | "hi";
type OcrStatus = "idle" | "uploading" | "processing" | "done" | "error";

interface LangOption {
  code: Lang;
  label: string;
  native: string;
}

const LANG_OPTIONS: LangOption[] = [
  { code: "auto", label: "Auto",    native: "Auto Detect" },
  { code: "ta",   label: "Tamil",   native: "தமிழ்" },
  { code: "en",   label: "English", native: "English" },
  { code: "hi",   label: "Hindi",   native: "हिन्दी" },
];

const LANG_LABEL: Record<string, string> = {
  ta: "Tamil", en: "English", hi: "Hindi", auto: "Auto",
};

interface ParsedFields {
  document_type:            string | null;
  patta_no:                 string | null;
  survey_no:                string | null;
  owner_name:               string | null;
  owner_father_or_son_name: string | null;
  district:                 string | null;
  taluk:                    string | null;
  village:                  string | null;
  land_type:                string | null;
  land_area_hectare:        string | null;
  land_area_acres:          string | null;
  land_amount_or_value:     string | null;
}

interface ForensicsData {
  status: "CLEAN" | "HIGH_RISK" | "VERIFIED" | "WARNING_NO_STAMP";
  is_suspicious: boolean;
  ela: {
    ela_score: number;
    is_suspicious: boolean;
    status: string;
  };
  assets: {
    stamp_count: number;
    signature_count: number;
    status: string;
  };
  lineage?: {
    status: string;
    message: string;
    requires_legal_heir_certificate: boolean;
    severity: string;
  };
}

interface OcrResult {
  success:       boolean;
  filename:      string;
  lang:          string;
  detected_lang: string;
  raw_text:      string;
  parsed_fields: ParsedFields;
  processing_ms: number;
  forensics?:    ForensicsData;
}

// ---------------------------------------------------------------------------
// Field display config
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<keyof ParsedFields, string> = {
  document_type:            "Document Type",
  patta_no:                 "Patta No.",
  survey_no:                "Survey No.",
  owner_name:               "Owner Name",
  owner_father_or_son_name: "Father / Son Name",
  district:                 "District",
  taluk:                    "Taluk / Tehsil",
  village:                  "Revenue Village",
  land_type:                "Land Type",
  land_area_hectare:        "Area (Hectares)",
  land_area_acres:          "Area (Acres)",
  land_amount_or_value:     "Land Value",
};

const FIELD_ORDER: (keyof ParsedFields)[] = [
  "document_type",
  "patta_no",
  "survey_no",
  "owner_name",
  "owner_father_or_son_name",
  "district",
  "taluk",
  "village",
  "land_type",
  "land_area_hectare",
  "land_area_acres",
  "land_amount_or_value",
];

const ACCEPT = ".jpg,.jpeg,.png,.tiff,.tif,.webp,.bmp,.pdf,.docx,.doc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function countExtracted(fields: ParsedFields): number {
  return FIELD_ORDER.filter((k) => fields[k] !== null).length;
}

// ---------------------------------------------------------------------------
// Clipboard copy helper
// ---------------------------------------------------------------------------

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OcrWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging]       = useState(false);
  const [lang, setLang]               = useState<Lang>("ta");
  const [file, setFile]               = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [status, setStatus]           = useState<OcrStatus>("idle");
  const [result, setResult]           = useState<OcrResult | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [rawExpanded, setRawExpanded] = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── Elapsed timer while processing ───────────────────────────────────────

  useEffect(() => {
    if (status !== "uploading" && status !== "processing") return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // ── File selection ────────────────────────────────────────────────────────

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = files[0];
    setFile(picked);
    setResult(null);
    setErrorMsg(null);
    setStatus("idle");     // re-enable Run button on new file
    setRawExpanded(false);

    if (picked.type.startsWith("image/")) {
      const url = URL.createObjectURL(picked);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Run OCR ───────────────────────────────────────────────────────────────

  const runOcr = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("lang", lang);

    try {
      setStatus("processing");
      const res = await fetch(`${API_BASE}/api/ocr`, {
        method: "POST",
        body:   form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }

      const data: OcrResult = await res.json();
      setResult(data);
      setStatus("done");
    } catch (err: unknown) {
      const isOffline =
        err instanceof TypeError && err.message.toLowerCase().includes("fetch");
      const msg = isOffline
        ? `Cannot reach backend at ${API_BASE}. Make sure start_backend.bat is running.`
        : err instanceof Error
          ? err.message
          : "Unknown error";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
    setStatus("idle");
    setRawExpanded(false);
    setElapsed(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Copy helpers ──────────────────────────────────────────────────────────

  const copyField = async (key: string, value: string) => {
    await copyText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob(
      [JSON.stringify(result.parsed_fields, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `terralens-${result.filename.replace(/\.[^.]+$/, "")}.json`;
    a.click();
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isProcessing = status === "uploading" || status === "processing";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Engine · PaddleOCR
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">
          OCR Extraction
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Upload a land document — image (JPG, PNG, TIFF, WEBP, BMP), PDF, or
          DOCX — and the backend will extract structured fields using PaddleOCR.
          Supports Tamil, English, and Hindi documents.
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* ── Left: upload panel ── */}
        <div className="flex w-full flex-col gap-4 lg:w-[380px] lg:shrink-0">

          {/* Language selector */}
          <section className="border border-tl-border bg-tl-panel">
            <div className="border-b border-tl-border px-5 py-3">
              <h3 className="text-[13px] font-semibold text-tl-text">
                Document Language
              </h3>
              <p className="mt-0.5 text-[11px] text-tl-muted">
                Select the primary language for best OCR accuracy
              </p>
            </div>
            <div className="grid grid-cols-4 gap-px bg-tl-border p-px">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  id={`lang-btn-${opt.code}`}
                  type="button"
                  onClick={() => !isProcessing && setLang(opt.code)}
                  disabled={isProcessing}
                  className={`flex flex-col items-center gap-0.5 px-1 py-3 text-center transition-colors disabled:opacity-50
                    ${lang === opt.code
                      ? "bg-tl-gold/15 text-tl-gold"
                      : "bg-tl-panel text-tl-muted hover:bg-white/[0.04] hover:text-tl-text"
                    }`}
                >
                  <span className="text-[13px] font-medium leading-none">
                    {opt.native}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.1em]">
                    {opt.label}
                  </span>
                  {lang === opt.code && (
                    <span className="mt-0.5 h-0.5 w-4 rounded-full bg-tl-gold" />
                  )}
                </button>
              ))}
            </div>
            {lang === "auto" && (
              <p className="px-5 py-2 text-[11px] text-tl-muted/70">
                Auto runs Tamil first, then re-runs with detected language if needed.
              </p>
            )}
          </section>

          {/* Drop zone */}
          <section className="border border-tl-border bg-tl-panel">
            <div className="border-b border-tl-border px-5 py-3">
              <h3 className="text-[13px] font-semibold text-tl-text">
                Upload document
              </h3>
              <p className="mt-0.5 text-[11px] text-tl-muted">
                JPG · PNG · TIFF · WEBP · BMP · PDF · DOCX
              </p>
            </div>

            <div className="p-4">
              <div
                id="ocr-drop-zone"
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !isProcessing && inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-4 py-8 text-center transition-colors ${
                  dragging
                    ? "border-tl-gold/70 bg-tl-gold/5"
                    : "border-tl-border bg-tl-bg/60 hover:border-tl-gold/40"
                } ${isProcessing ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-tl-muted"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div>
                  <p className="text-[13px] font-medium text-tl-text">
                    Drop file here
                  </p>
                  <p className="mt-0.5 text-[11px] text-tl-muted">
                    or click to browse
                  </p>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </section>

          {/* File card */}
          {file && (
            <div className="border border-tl-border bg-tl-panel">
              {previewUrl && (
                <div className="border-b border-tl-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-52 w-full object-contain bg-black/20"
                  />
                </div>
              )}

              <div className="flex items-start justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-tl-text">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-tl-muted">
                    {fileSizeLabel(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  disabled={isProcessing}
                  className="shrink-0 text-[11px] text-tl-muted hover:text-tl-text disabled:opacity-40"
                >
                  Remove
                </button>
              </div>

              {/* Run button */}
              <div className="border-t border-tl-border px-4 py-3">
                <button
                  id="ocr-run-btn"
                  type="button"
                  onClick={runOcr}
                  disabled={isProcessing}
                  className={`flex w-full items-center justify-center gap-2 rounded-sm border py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-all ${
                    isProcessing
                      ? "border-tl-gold/20 bg-tl-gold/5 text-tl-gold/50 cursor-wait"
                      : "border-tl-gold/50 bg-tl-gold/10 text-tl-gold hover:bg-tl-gold/20"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <span
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-tl-gold/30 border-t-tl-gold"
                        aria-hidden
                      />
                      {status === "uploading" ? "Uploading…" : `Running OCR… ${elapsed}s`}
                    </>
                  ) : (
                    "Run OCR"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && errorMsg && (
            <div
              role="alert"
              aria-live="assertive"
              className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300"
            >
              <p className="font-semibold">OCR failed</p>
              <p className="mt-1 font-mono text-[11px] break-all">{errorMsg}</p>
              <button
                type="button"
                onClick={runOcr}
                disabled={!file}
                className="mt-2 text-[11px] underline underline-offset-2 hover:text-red-200"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ── Right: results panel ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">

          {/* Processing indicator */}
          {isProcessing && (
            <div className="border border-tl-border bg-tl-panel px-6 py-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative h-12 w-12">
                  <span className="absolute inset-0 animate-spin rounded-full border-2 border-tl-gold/20 border-t-tl-gold" />
                  <span
                    className="absolute inset-2 animate-spin rounded-full border-2 border-tl-border border-b-tl-gold/50"
                    style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                  />
                </div>

                <div>
                  <p className="text-[13px] font-semibold text-tl-text" aria-live="polite">
                    {status === "uploading"
                      ? "Uploading document…"
                      : elapsed < 3
                        ? "Initialising OCR engine…"
                        : elapsed < 20
                          ? "Running text recognition…"
                          : "Extracting structured fields…"}
                  </p>
                  <p className="mt-1 text-[11px] text-tl-muted">
                    Elapsed: {elapsed}s · Language: {LANG_LABEL[lang] ?? lang}
                  </p>
                </div>

                {/* Animated progress bar */}
                <div className="w-full max-w-xs overflow-hidden rounded-full border border-tl-border bg-tl-bg/60 h-1">
                  <div
                    className="h-full bg-tl-gold/60 transition-all duration-1000"
                    style={{ width: `${Math.min(95, elapsed * 4)}%` }}
                  />
                </div>

                <p className="text-[11px] text-tl-muted/60">
                  Large PDFs and first-run model loading may take 30–60 s
                </p>
              </div>
            </div>
          )}

          {/* Placeholder */}
          {!result && !isProcessing && status !== "error" && (
            <div className="flex flex-1 flex-col items-center justify-center border border-dashed border-tl-border bg-tl-panel px-6 py-20 text-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-4 h-10 w-10 text-tl-muted/40"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 9h8M8 12h5M8 15h6" />
              </svg>
              <p className="text-sm text-tl-muted">
                Select a language, upload a document and click{" "}
                <strong>Run OCR</strong> to see results here.
              </p>
            </div>
          )}

          {/* Results */}
          {result && !isProcessing && (
            <>
              {/* Metadata bar */}
              <div className="flex flex-wrap items-center gap-3 border border-tl-border bg-tl-panel px-5 py-3">
                <span className="rounded-sm border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-green-400">
                  ✓ Success
                </span>
                <span className="text-[11px] text-tl-muted">
                  {result.filename}
                </span>
                <span className="text-tl-border">·</span>
                <span className="text-[11px] text-tl-muted">
                  {fmtMs(result.processing_ms)}
                </span>
                <span className="text-tl-border">·</span>
                <span className="rounded-sm border border-tl-border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-tl-muted">
                  {LANG_LABEL[result.detected_lang] ?? result.detected_lang}
                  {result.lang === "auto" && result.detected_lang !== "auto" && (
                    <span className="ml-1 text-tl-muted/50">(auto‑detected)</span>
                  )}
                </span>
                <span className="text-tl-border">·</span>
                <span className="text-[11px] text-tl-muted">
                  {countExtracted(result.parsed_fields)}/{FIELD_ORDER.length} fields extracted
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    id="ocr-download-json"
                    onClick={downloadJson}
                    className="flex items-center gap-1 border border-tl-border px-2.5 py-1 text-[11px] text-tl-muted hover:border-tl-gold/40 hover:text-tl-gold transition-colors"
                  >
                    ↓ JSON
                  </button>
                  <button
                    type="button"
                    id="ocr-run-again"
                    onClick={runOcr}
                    disabled={!file}
                    className="flex items-center gap-1 border border-tl-border px-2.5 py-1 text-[11px] text-tl-muted hover:border-tl-gold/40 hover:text-tl-gold transition-colors"
                  >
                    ↺ Re-run
                  </button>
                </div>
              </div>

              {/* Forensics & Compliance Panel */}
              {result.forensics && (
                <section className={`border px-5 py-4 ${
                  result.forensics.status === "HIGH_RISK" 
                    ? "border-red-500/50 bg-red-500/5" 
                    : "border-tl-border bg-tl-panel"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
                        Compliance
                      </p>
                      <h3 className={`mt-0.5 text-[14px] font-semibold ${
                        result.forensics.status === "HIGH_RISK" ? "text-red-400" : "text-tl-text"
                      }`}>
                        Forensic Analysis
                      </h3>
                    </div>
                    {result.forensics.status === "HIGH_RISK" ? (
                      <span className="rounded-sm bg-red-500/20 border border-red-500/50 px-2.5 py-1 text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        HIGH RISK DETECTED
                      </span>
                    ) : (
                      <span className="rounded-sm bg-green-500/10 border border-green-500/30 px-2.5 py-1 text-[11px] font-bold text-green-400">
                        CLEAN DOCUMENT
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mt-4">
                    {/* Splicing */}
                    <div className="border border-tl-border bg-tl-bg/50 p-3 rounded-sm">
                      <p className="text-[11px] text-tl-muted font-medium mb-1 uppercase tracking-widest">Digital Splice (ELA)</p>
                      {result.forensics.ela.is_suspicious ? (
                        <p className="text-[12px] text-red-400">⚠️ Manipulation Detected (Score: {result.forensics.ela.ela_score}%)</p>
                      ) : (
                        <p className="text-[12px] text-green-400">✓ Authentic (Score: {result.forensics.ela.ela_score}%)</p>
                      )}
                    </div>
                    
                    {/* Stamps & Signatures */}
                    <div className="border border-tl-border bg-tl-bg/50 p-3 rounded-sm">
                      <p className="text-[11px] text-tl-muted font-medium mb-1 uppercase tracking-widest">Physical Assets</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] text-tl-text">{result.forensics.assets.stamp_count > 0 ? "✓" : "⚠️"} {result.forensics.assets.stamp_count} Wet-Ink Stamps</span>
                        <span className="text-[12px] text-tl-text">{result.forensics.assets.signature_count > 0 ? "✓" : "⚠️"} {result.forensics.assets.signature_count} Signatures</span>
                      </div>
                    </div>
                    
                    {/* Lineage Verification */}
                    {result.forensics.lineage && (
                      <div className={`border p-3 rounded-sm ${
                        result.forensics.lineage.severity === "HIGH_RISK" 
                          ? "border-red-500/40 bg-red-500/10" 
                          : "border-tl-border bg-tl-bg/50"
                      }`}>
                        <p className="text-[11px] text-tl-muted font-medium mb-1 uppercase tracking-widest">Life State DB</p>
                        <p className={`text-[12px] font-medium leading-relaxed ${
                          result.forensics.lineage.severity === "HIGH_RISK" ? "text-red-400" : "text-green-400"
                        }`}>
                          {result.forensics.lineage.message}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Hard Stop / Legal Heir Certificate Block */}
                  {result.forensics.lineage?.requires_legal_heir_certificate && (
                    <div className="mt-4 border border-red-500/50 bg-red-950/30 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-bold text-red-400">TRANSFER BLOCKED: Legal Heir Certificate Required</p>
                        <p className="text-[11px] text-tl-muted mt-1">This transaction cannot proceed until a digitally verified Legal Heir Certificate (Varisu Sannidhi) is attached to the deceased owner's file.</p>
                      </div>
                      <button className="shrink-0 ml-4 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-200 text-[11px] font-semibold uppercase tracking-wider hover:bg-red-500/40 transition-colors">
                        Upload Certificate
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Parsed fields table */}
              <section className="border border-tl-border bg-tl-panel">
                <div className="border-b border-tl-border px-5 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
                    Extracted
                  </p>
                  <h3 className="mt-0.5 text-[14px] font-semibold text-tl-text">
                    Parsed Fields
                  </h3>
                </div>

                <div className="divide-y divide-tl-border">
                  {FIELD_ORDER.map((key) => {
                    const val = result.parsed_fields[key];
                    return (
                      <div
                        key={key}
                        className="group flex items-center gap-4 px-5 py-2.5"
                      >
                        <span className="w-44 shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-tl-muted">
                          {FIELD_LABELS[key]}
                        </span>
                        <span
                          className={`min-w-0 flex-1 break-words text-[13px] font-mono ${
                            val ? "text-tl-text" : "italic text-tl-muted/40"
                          }`}
                        >
                          {val ?? "—"}
                        </span>
                        {val && (
                          <button
                            type="button"
                            onClick={() => copyField(key, val)}
                            className="shrink-0 text-[10px] text-tl-muted/0 transition-all group-hover:text-tl-muted hover:text-tl-gold"
                            title="Copy"
                          >
                            {copiedField === key ? "✓ copied" : "copy"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Raw OCR text */}
              <section className="border border-tl-border bg-tl-panel">
                <div className="flex items-center border-b border-tl-border">
                  <button
                    type="button"
                    id="ocr-raw-toggle"
                    onClick={() => setRawExpanded((v) => !v)}
                    className="flex flex-1 items-center justify-between px-5 py-3 text-left hover:bg-white/[0.02]"
                  >
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
                        Raw
                      </p>
                      <h3 className="mt-0.5 text-[14px] font-semibold text-tl-text">
                        OCR Text Output
                      </h3>
                    </div>
                    <span className="text-[11px] text-tl-muted">
                      {rawExpanded ? "▲ Collapse" : "▼ Expand"}
                    </span>
                  </button>
                  {rawExpanded && (
                    <button
                      type="button"
                      id="ocr-copy-raw"
                      onClick={() => copyField("raw_text", result.raw_text)}
                      className="mr-4 shrink-0 text-[11px] text-tl-muted hover:text-tl-gold transition-colors"
                    >
                      {copiedField === "raw_text" ? "✓ copied" : "Copy all"}
                    </button>
                  )}
                </div>

                {rawExpanded && (
                  <pre className="max-h-80 overflow-y-auto p-5 font-mono text-[12px] leading-relaxed text-tl-muted whitespace-pre-wrap break-words">
                    {result.raw_text || "(no text extracted)"}
                  </pre>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
