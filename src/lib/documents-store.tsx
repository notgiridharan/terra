"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  isClassificationLocked,
  mockClassify,
  type ClassificationDecision,
  type RecordType,
} from "@/lib/classification";
import {
  inferFormat,
  isAcceptedFile,
  isTerminalStatus,
  MAX_FILE_BYTES,
  pickMockOutcome,
  SEED_DOCUMENTS,
  hydrateDocument,
  type DocumentStatus,
  type LandDocument,
  mapRecordToDocument,
} from "@/lib/documents";
import {
  idlePreprocessing,
  mockQualityAfter,
  PROCESS_STEPS,
  type PreprocessStageId,
} from "@/lib/preprocessing";
import {
  applyFieldEdit,
  type RecordSectionId,
} from "@/lib/structured-record";
import {
  fetchRecords,
  fetchRecord,
  updateRecord,
  deleteRecord,
  ocrUpload,
  API_BASE,
} from "@/lib/api";

type DocumentsContextValue = {
  documents: LandDocument[];
  error: string | null;
  lastUploadedId: string | null;
  previewUrls: Record<string, string>;
  addFiles: (files: FileList | File[]) => void;
  clearError: () => void;
  acceptClassification: (id: string, selectedType?: RecordType) => void;
  sendForManualReview: (id: string) => void;
  runPreprocessing: (id: string) => void;
  updateStructuredField: (
    documentId: string,
    section: RecordSectionId,
    key: string,
    value: string,
  ) => void;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;
  deleteDocument: (id: string) => Promise<void>;
};

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

function canPreviewInBrowser(mimeType: string, name: string): boolean {
  const lower = name.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return true;
  if (
    mimeType === "image/tiff" ||
    mimeType === "image/bmp" ||
    lower.endsWith(".tif") ||
    lower.endsWith(".tiff") ||
    lower.endsWith(".bmp")
  ) {
    return false;
  }
  return mimeType.startsWith("image/");
}

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<LandDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const timers = useRef<Map<string, number[]>>(new Map());
  const preprocessTimers = useRef<Map<string, number[]>>(new Map());
  const previewUrlsRef = useRef<Record<string, string>>({});

  const clearTimers = useCallback((id: string) => {
    const list = timers.current.get(id);
    if (!list) return;
    list.forEach((handle) => window.clearTimeout(handle));
    timers.current.delete(id);
  }, []);

  const clearPreprocessTimers = useCallback((id: string) => {
    const list = preprocessTimers.current.get(id);
    if (!list) return;
    list.forEach((handle) => window.clearTimeout(handle));
    preprocessTimers.current.delete(id);
  }, []);

  // Database persistence helper
  const persistToDb = useCallback(async (idStr: string, doc: LandDocument) => {
    if (idStr.startsWith("temp-")) return;

    let dbId = doc.dbId;
    if (!dbId) {
      const numeric = parseInt(idStr, 10);
      if (!isNaN(numeric)) {
        dbId = numeric;
      }
    }

    if (!dbId) return;

    try {
      const getVal = (sec: string, k: string) => {
        const found = (doc.structuredRecord.sections as any)[sec]?.find((f: any) => f.key === k);
        return found ? found.value : null;
      };

      await updateRecord(dbId, {
        owner_name: getVal("owner", "owner_name"),
        owner_father_or_son_name: getVal("owner", "relation"),
        survey_no: getVal("property", "survey_no"),
        land_area_acres: getVal("property", "extent"),
        land_type: getVal("property", "land_type"),
        patta_no: getVal("property", "patta_no"),
        document_type: getVal("transaction", "doc_type"),
        district: getVal("location", "district"),
        taluk: getVal("location", "taluk"),
        village: getVal("location", "village"),
        sync_status: doc.status,
        ocr_metadata: {
          forensics: (doc as any).forensics || null,
          preprocessed_url: doc.preprocessedUrl ? doc.preprocessedUrl.replace(API_BASE, "") : null,
          extra: {
            structuredRecord: doc.structuredRecord,
            classification: doc.classification,
            preprocessing: doc.preprocessing,
            mimeType: doc.mimeType,
            sizeBytes: doc.sizeBytes
          }
        }
      });
    } catch (err) {
      console.error("Failed to persist document change to backend:", err);
    }
  }, []);

  const updateStatus = useCallback((id: string, status: DocumentStatus) => {
    setDocuments((current) =>
      current.map((doc) => {
        if (doc.id !== id) return doc;
        if (isClassificationLocked(doc.classification)) return doc;
        const updated = { ...doc, status };
        persistToDb(id, updated);
        return updated;
      }),
    );
  }, [persistToDb]);

  const startMockPipeline = useCallback(
    (id: string, name: string, from: DocumentStatus = "Uploaded") => {
      if (isTerminalStatus(from)) return;

      clearTimers(id);
      const outcome = pickMockOutcome(name);
      const handles: number[] = [];

      const schedule = (status: DocumentStatus, delay: number) => {
        handles.push(window.setTimeout(() => updateStatus(id, status), delay));
      };

      if (from === "Uploaded") {
        schedule("Processing", 900);
        schedule("Classified", 2400);
        schedule(outcome, 4000);
        if (outcome === "Validated") schedule("Approved", 5600);
      } else if (from === "Processing") {
        schedule("Classified", 1500);
        schedule(outcome, 3100);
        if (outcome === "Validated") schedule("Approved", 4700);
      } else if (from === "Classified") {
        schedule(outcome, 1600);
        if (outcome === "Validated") schedule("Approved", 3200);
      } else if (from === "Validated") {
        schedule("Approved", 1400);
      }

      timers.current.set(id, handles);
    },
    [clearTimers, updateStatus],
  );

  // Load from Database on mount
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const dbRecords = await fetchRecords();
        if (!active) return;
        
        // Filter: queue documents (they have source_filename)
        const mapped = dbRecords
          .filter((r) => r.input_image.source_filename)
          .map((r) => mapRecordToDocument(r));
        
        setDocuments(mapped);
        setHydrated(true);

        // Resume mock pipeline for any non-terminal uploads
        mapped.forEach((doc) => {
          if (
            doc.origin === "upload" &&
            !isTerminalStatus(doc.status) &&
            !isClassificationLocked(doc.classification) &&
            !doc.id.startsWith("temp-")
          ) {
            startMockPipeline(doc.id, doc.name, doc.status);
          }
        });
      } catch (err) {
        console.error("Failed to load database records:", err);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [startMockPipeline]);

  useEffect(() => {
    return () => {
      timers.current.forEach((handles) => {
        handles.forEach((handle) => window.clearTimeout(handle));
      });
      timers.current.clear();
      preprocessTimers.current.forEach((handles) => {
        handles.forEach((handle) => window.clearTimeout(handle));
      });
      preprocessTimers.current.clear();
      Object.values(previewUrlsRef.current).forEach((url) =>
        URL.revokeObjectURL(url),
      );
    };
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const files = Array.from(incoming);
      if (files.length === 0) return;

      const rejected: string[] = [];
      const accepted: LandDocument[] = [];
      const nextUrls: Record<string, string> = {};

      for (const file of files) {
        if (!isAcceptedFile(file)) {
          rejected.push(`${file.name} (unsupported type)`);
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          rejected.push(`${file.name} (exceeds 40 MB)`);
          continue;
        }

        const format = inferFormat(file);
        if (!format) {
          rejected.push(`${file.name} (unsupported type)`);
          continue;
        }

        const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        if (canPreviewInBrowser(file.type, file.name)) {
          nextUrls[tempId] = URL.createObjectURL(file);
        }

        const tempDoc = hydrateDocument({
          id: tempId,
          name: file.name,
          format,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          status: "Processing",
          origin: "upload",
        });

        // Add to state immediately
        setDocuments((current) => [tempDoc, ...current]);
        setPreviewUrls((current) => ({ ...current, ...nextUrls }));
        setLastUploadedId(tempId);

        // Upload to backend API 
        ocrUpload(file, "ta")
          .then((res) => {
            if (res.record_id) {
              return fetchRecord(res.record_id);
            }
            throw new Error("OCR Upload completed without generating record ID.");
          })
          .then((dbRecord) => {
            const doc = mapRecordToDocument(dbRecord);
            setDocuments((current) =>
              current.map((item) => (item.id === tempId ? doc : item))
            );
            if (nextUrls[tempId]) {
              setPreviewUrls((current) => {
                const next = { ...current };
                next[doc.id] = next[tempId];
                delete next[tempId];
                return next;
              });
            }
            // Trigger downstream pipeline
            startMockPipeline(doc.id, doc.name, doc.status);
          })
          .catch((err) => {
            console.error("Upload error:", err);
            setError(`Failed to process ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
            setDocuments((current) =>
              current.map((item) => (item.id === tempId ? { ...item, status: "Needs Verification" } : item))
            );
          });
      }

      if (rejected.length > 0) {
        setError(
          `Rejected: ${rejected.join("; ")}. Accepted: PDF, JPG, PNG, WEBP, GIF, TIFF, BMP.`,
        );
      } else {
        setError(null);
      }
    },
    [startMockPipeline],
  );

  const setDecision = useCallback(
    (id: string, decision: ClassificationDecision, selectedType?: RecordType) => {
      clearTimers(id);
      setDocuments((current) =>
        current.map((doc) => {
          if (doc.id !== id) return doc;
          const predicted = selectedType ?? doc.classification.predictedType;
          const updated = {
            ...doc,
            status:
              decision === "accepted" ? ("Classified" as DocumentStatus) : ("Needs Verification" as DocumentStatus),
            classification: {
              ...doc.classification,
              predictedType: predicted,
              decision,
            },
          };
          persistToDb(id, updated);
          return updated;
        }),
      );
    },
    [clearTimers, persistToDb],
  );

  const acceptClassification = useCallback(
    (id: string, selectedType?: RecordType) => {
      setDecision(id, "accepted", selectedType);
    },
    [setDecision],
  );

  const sendForManualReview = useCallback(
    (id: string) => {
      setDecision(id, "manual_review");
    },
    [setDecision],
  );

  const patchPreprocessing = useCallback(
    (id: string, updater: (doc: LandDocument) => LandDocument) => {
      setDocuments((current) =>
        current.map((doc) => {
          if (doc.id !== id) return doc;
          const updated = updater(doc);
          persistToDb(id, updated);
          return updated;
        }),
      );
    },
    [persistToDb],
  );

  const runPreprocessing = useCallback(
    (id: string) => {
      const target = documents.find((doc) => doc.id === id);
      if (!target) return;

      clearPreprocessTimers(id);
      const before = target.preprocessing.qualityBefore;
      const after = mockQualityAfter(before);

      patchPreprocessing(id, (doc) => ({
        ...doc,
        preprocessing: {
          ...idlePreprocessing(doc.name),
          qualityBefore: before,
          status: "Queued",
          activeStage: "original",
          completedStages: ["original"],
        },
      }));

      const handles: number[] = [];
      handles.push(
        window.setTimeout(() => {
          patchPreprocessing(id, (doc) => ({
            ...doc,
            preprocessing: {
              ...doc.preprocessing,
              status: "Processing",
              activeStage: "deskew",
            },
          }));
        }, 350),
      );

      PROCESS_STEPS.forEach((stage, index) => {
        const startAt = 350 + index * 900;
        const doneAt = startAt + 850;
        handles.push(
          window.setTimeout(() => {
            patchPreprocessing(id, (doc) => ({
              ...doc,
              preprocessing: {
                ...doc.preprocessing,
                status: "Processing",
                activeStage: stage,
              },
            }));
          }, startAt),
        );
        handles.push(
          window.setTimeout(() => {
            patchPreprocessing(id, (doc) => {
              const completed = Array.from(
                new Set([...doc.preprocessing.completedStages, stage]),
              ) as PreprocessStageId[];
              const isLast = stage === "restoration";
              return {
                ...doc,
                preprocessing: {
                  ...doc.preprocessing,
                  completedStages: completed,
                  activeStage: isLast ? "restoration" : stage,
                  status: isLast ? "Complete" : "Processing",
                  qualityAfter: isLast ? after : doc.preprocessing.qualityAfter,
                },
              };
            });
          }, doneAt),
        );
      });

      preprocessTimers.current.set(id, handles);
    },
    [clearPreprocessTimers, documents, patchPreprocessing],
  );

  const updateStructuredField = useCallback(
    (
      documentId: string,
      section: RecordSectionId,
      key: string,
      value: string,
    ) => {
      setDocuments((current) =>
        current.map((doc) => {
          if (doc.id !== documentId) return doc;
          const updated = {
            ...doc,
            structuredRecord: applyFieldEdit(
              doc.structuredRecord,
              section,
              key,
              value,
            ),
          };
          persistToDb(documentId, updated);
          return updated;
        }),
      );
    },
    [persistToDb],
  );

  const setDocumentStatus = useCallback(
    (id: string, status: DocumentStatus) => {
      setDocuments((current) =>
        current.map((doc) => {
          if (doc.id !== id) return doc;
          const updated = { ...doc, status };
          persistToDb(id, updated);
          return updated;
        }),
      );
    },
    [persistToDb],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const target = documents.find((d) => d.id === id);
      setDocuments((current) => current.filter((doc) => doc.id !== id));
      if (target && target.dbId) {
        try {
          await deleteRecord(target.dbId);
        } catch (err) {
          console.error("Failed to delete record from DB:", err);
        }
      }
    },
    [documents],
  );

  const value = useMemo(
    () => ({
      documents,
      error,
      lastUploadedId,
      previewUrls,
      addFiles,
      clearError: () => setError(null),
      acceptClassification,
      sendForManualReview,
      runPreprocessing,
      updateStructuredField,
      setDocumentStatus,
      deleteDocument,
    }),
    [
      acceptClassification,
      addFiles,
      deleteDocument,
      documents,
      error,
      lastUploadedId,
      previewUrls,
      sendForManualReview,
      runPreprocessing,
      updateStructuredField,
      setDocumentStatus,
    ],
  );

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) {
    throw new Error("useDocuments must be used within DocumentsProvider");
  }
  return ctx;
}
