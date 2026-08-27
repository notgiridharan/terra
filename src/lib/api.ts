export const API_BASE = typeof window !== "undefined"
  ? `http://${window.location.hostname}:8000`
  : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Typed OCR upload helper
// ---------------------------------------------------------------------------

export type OcrLang = "auto" | "ta" | "en" | "hi";

export interface OcrResponse {
  success:       boolean;
  filename:      string;
  lang:          string;
  detected_lang: string;
  raw_text:      string;
  parsed_fields: Record<string, string | null>;
  processing_ms: number;
  record_id?:    number;
}

export async function ocrUpload(
  file: File,
  lang: OcrLang = "ta"
): Promise<OcrResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("lang", lang);

  const res = await fetch(`${API_BASE}/api/ocr`, {
    method: "POST",
    body:   form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<OcrResponse>;
}

// ---------------------------------------------------------------------------
// Languages list helper
// ---------------------------------------------------------------------------

export interface LangInfo {
  code:  string;
  label: string;
}

export async function fetchOcrLanguages(): Promise<LangInfo[]> {
  const res = await fetch(`${API_BASE}/api/ocr/languages`);
  if (!res.ok) throw new Error("Could not fetch languages from backend.");
  return res.json() as Promise<LangInfo[]>;
}

// ---------------------------------------------------------------------------
// Database Land Record Types & API helpers
// ---------------------------------------------------------------------------

export interface LandRecordResponse {
  id: number;
  input_image: {
    source_filename: string | null;
    image_url: string | null;
    has_base64: boolean;
  };
  output_information: {
    document_type: string | null;
    patta_no: string | null;
    survey_no: string | null;
    owner_name: string | null;
    owner_father_or_son_name: string | null;
    district: string | null;
    taluk: string | null;
    village: string | null;
    land_type: string | null;
    land_area_hectare: string | null;
    land_area_acres: string | null;
    land_amount_or_value: string | null;
    raw_text: string | null;
    parsed_fields: Record<string, any>;
  };
  gis_spatial_data: {
    geojson_geometry: any | null;
    latitude: number | null;
    longitude: number | null;
  };
  ocr_metadata: {
    ocr_language: string;
    detected_lang: string | null;
    processing_ms: number | null;
    extra: any | null;
  };
  government_integration: {
    external_gov_id: string | null;
    sync_status: string;
  };
  created_at: string | null;
  updated_at: string | null;
}

export async function fetchRecords(): Promise<LandRecordResponse[]> {
  const res = await fetch(`${API_BASE}/api/v1/records?limit=1000`);
  if (!res.ok) throw new Error("Could not fetch land records from database backend.");
  return res.json() as Promise<LandRecordResponse[]>;
}

export async function fetchRecord(id: number): Promise<LandRecordResponse> {
  const res = await fetch(`${API_BASE}/api/v1/records/${id}`);
  if (!res.ok) throw new Error(`Could not fetch land record ${id} from database backend.`);
  return res.json() as Promise<LandRecordResponse>;
}

export async function updateRecord(
  id: number,
  payload: Partial<{
    source_filename: string | null;
    image_url: string | null;
    image_base64: string | null;
    document_type: string | null;
    patta_no: string | null;
    survey_no: string | null;
    owner_name: string | null;
    owner_father_or_son_name: string | null;
    district: string | null;
    taluk: string | null;
    village: string | null;
    land_type: string | null;
    land_area_hectare: string | null;
    land_area_acres: string | null;
    land_amount_or_value: string | null;
    raw_text: string | null;
    parsed_fields_json: Record<string, any> | null;
    geojson_geometry: any | null;
    latitude: number | null;
    longitude: number | null;
    ocr_language: string | null;
    detected_lang: string | null;
    processing_ms: number | null;
    ocr_metadata: any | null;
    external_gov_id: string | null;
    sync_status: string | null;
  }>
): Promise<LandRecordResponse> {
  const res = await fetch(`${API_BASE}/api/v1/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Could not update land record ${id}.`);
  return res.json() as Promise<LandRecordResponse>;
}

export async function deleteRecord(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/records/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Could not delete land record ${id}.`);
}

export async function fetchGisGeoJSON(): Promise<{ type: string; features: any[] }> {
  const res = await fetch(`${API_BASE}/api/v1/gis/geojson`);
  if (!res.ok) throw new Error("Could not fetch GIS GeoJSON layers from database backend.");
  return res.json() as Promise<{ type: string; features: any[] }>;
}

// ---------------------------------------------------------------------------
// Real OpenCV preprocessing helper
// ---------------------------------------------------------------------------

export interface PreprocessQuality {
  score: number;
  label: string;
  skewDegrees: number;
  noiseIndex: number;
  contrast: number;
  readability: number;
}

export interface PreprocessResponse {
  success: boolean;
  record_id: number;
  qualityBefore: PreprocessQuality;
  qualityAfter: PreprocessQuality;
  stageUrls: Record<string, string>;
}

export async function runOpenCvPreprocessing(recordId: number): Promise<PreprocessResponse> {
  const res = await fetch(`${API_BASE}/api/preprocess/${recordId}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<PreprocessResponse>;
}

