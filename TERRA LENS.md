# TerraLens

Intelligent Land Record Digitization & Reconciliation System.

This file is the living project brief. Update it whenever a module is built so later work stays aligned.

**Build rule:** implement only what the current prompt asks for. Keep architecture compatible with the full pipeline below. Do not expand into unrequested modules.

---

## Product

TerraLens processes historical Indian land documents and reconciles them against existing government records.

**Document types (planned):** RoR, Patta, Chitta, A-Register, FMB, cadastral maps, mutation records, sale deeds, registration records, tax records, subdivision records, old settlement registers.

**Differentiator:** the system does not only digitize. It compares extracted historical records with existing government data to identify ownership, area, transaction, mutation, duplicate, and other conflicts.

**Decision model:** AI handles repetitive processing and recommendations. Authorized officers make final decisions for uncertain or conflicting records.

**UI:** professional Government-Tech — dark, clean, serious, information-dense, not flashy.

---

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router) at repo root (`src/`) |
| API | FastAPI in `backend/` (sample routes + CORS) |
| Language | TypeScript (frontend), Python (API) |
| Styling | Tailwind CSS v4 |
| Fonts | Geist / Geist Mono |
| Supporting tech | Add only when a later prompt needs it (OCR, OpenCV, GIS, DB, etc.) |

---

## Core pipeline (target)

Document Upload
→ Document Classification
→ OpenCV Preprocessing
→ OCR / Handwriting Recognition
→ Layout & NLP Structuring
→ Confidence Scoring
→ Business Rule Validation
→ Existing Land Record Reconciliation
→ Conflict Detection
→ Officer Manual Verification
→ Master Land Database
→ LRMS / GIS Integration
→ Audit Logs & Version History

---

## Build status

| Status | Meaning |
| --- | --- |
| Done | Implemented in the current app |
| Shell | Route + layout exist; no module logic yet |
| Upcoming | Not started |

### Application shell — Done

- Next.js + TypeScript + Tailwind project at this repo root
- Dark professional dashboard chrome
- Persistent **sidebar** with all primary modules
- Persistent **top navbar** (module title, restricted-system badge, officer name, role, logout)
- **Main content area** for each route
- Client-side active-route highlighting
- Shared placeholder panel for modules that are not built yet
- Officer session in the sidebar from mock auth
- Mock login at `/login`; unauthenticated requests redirected by `src/proxy.ts`

### Modules

| Module | Route | Status | Notes |
| --- | --- | --- | --- |
| Login | `/login` | Done | Mock government officer portal; session cookie; protected routes |
| Dashboard | `/` | Done | Mock KPIs, pipeline, conflicts, officer workload, recent exceptions |
| Documents | `/documents` | Done | Upload PDF/image/scan, queue table, mock status pipeline |
| Classification | `/classification` | Done | Preview + mock AI type, confidence, alternatives, language; Accept / Manual Review |
| Preprocessing | `/preprocessing` | Done | Mock OpenCV stages, before/after preview, status, quality |
| Extraction | `/extraction` | Partial | Same mock OpenCV preprocessing workspace (OCR later) |
| Structured Record | `/structured-record` | Done | Mock clean land record; officer-editable fields with AI vs officer origin |
| Validation | `/validation` | Done | Mock business rules on structured record; Passed / Warning / Conflict + summary |
| Reconciliation | `/reconciliation` | Done | Historical vs LRMS compare; MATCH / PARTIAL / CONFLICT / MISSING / DUPLICATE; 5→1→4 acre chain; timeline |
| Conflicts | `/conflicts` | Done | Reconciliation conflict queue with severity, evidence, and officer actions |
| Verification | `/verification` | Done | Officer case screen: source, OCR, structured, LRMS, recon, conflicts; AI recommends; officer decides |
| Land Records | `/land-records` | Done | Searchable mock master file; click row for owners, transactions, mutations, linked docs |
| GIS Map | `/gis-map` | Done | Mock cadastral parcels; click for details; conflict hatch |
| Audit Logs | `/audit-logs` | Done | AI/officer activity log; time/user/action/record/old/new; version history + revert |
| Settings | `/settings` | Shell | Roles, config, integration endpoints |
| Demo page | `/demo` | Done | PPT walkthrough index (not listed in Operations sidebar) |

---

## Upcoming features (by module)

Build these only when a later prompt asks. Listed here so the layout and data model stay compatible.

### Login / session

**Shipped (2026-08-25)**

- Government Officer Portal at `/login` (logo, Official ID, password, Remember me, Forgot password)
- Mock demo officer `RO-4821` / `TerraLens@2026`
- Roles typed as Officer, Senior Officer, Administrator (demo account is Officer)
- Session cookie; logout; name and role in the navbar
- `src/proxy.ts` blocks unauthenticated access to internal routes

**Still upcoming**

- Real identity provider / department SSO

### Dashboard

**Shipped (2026-08-25)**

- Mock KPIs: queue, processing, verification, conflicts, approvals
- Pipeline stage counts, conflict-by-type, officer workload
- Recent ingest / exception feed (links into working modules)

**Still upcoming**

- Live counts from the document and conflict stores

### Documents

**Shipped (2026-08-25)**

- Multi-file upload of PDFs, images, and scanned documents (TIFF/BMP treated as scans)
- Drag-and-drop plus file picker
- Uploaded-documents table with format, size, time, and status
- Statuses: Uploaded, Processing, Classified, Needs Verification, Validated, Conflict Detected, Approved
- Mock pipeline after upload (no OCR)
- Shared in-memory/session queue (`DocumentsProvider`) for later modules

**Still upcoming**

- Document metadata (district, village, survey no., year, source)
- Queue retry / reject actions
- Preview of original scan (PDF/JPG/PNG on Classification; TIFF still placeholder)
- Real classification / OCR handoff

### Classification

**Shipped (2026-08-25)**

- Queue of uploaded/sample documents with live selection
- Document preview (PDF/JPG/PNG blob preview; facsimile placeholder for seeds and TIFF/BMP)
- Mock AI classification for: RoR, Patta, Chitta, A-Register, FMB, Cadastral Map, Mutation Document, Sale Deed, Registration Document, Tax Record, Subdivision Record, Old Settlement Register
- Predicted type, confidence, alternative types, detected language
- Accept Classification (optional alternative selection) and Send for Manual Review
- Officer decision stops the mock downstream pipeline for that record

**Still upcoming**

- Real model inference
- Routing into extraction templates per type
- Officer free-text override notes

### Preprocessing

**Shipped (2026-08-25)**

- Pipeline: Original Document → Deskew → Noise Removal → Enhancement → Text Restoration
- Before / after preview (CSS filters stand in for OpenCV; facsimile for PDF/TIFF/samples)
- Processing status (Idle, Queued, Processing, Complete) with stage progress
- Document quality before and after (score, skew, noise, contrast, readability)
- Mock run / re-run from the document queue (auto-starts on an idle document)
- Same workspace is shown on **Extraction** until OCR is built

**Still upcoming**

- Real OpenCV (deskew, denoise, contrast, crop)
- Pixel-accurate output frames stored for extraction

### Extraction

**Shipped (partial)**

- Hosts the mock OpenCV preprocessing workspace until OCR is added

**Still upcoming**

- Printed OCR and handwriting recognition
- Layout detection and NLP field structuring
- Extracted fields: owner, survey number, extent/area, boundaries, khata, mutation refs, tax, registration, etc.
- Side-by-side original document vs structured output

### Structured Record

**Shipped (2026-08-25)**

- Clean land record from mock extracted data
- Sections: Property, Owner, Location, Transaction, History
- Columns: field, value, confidence, source page, origin
- Officer inline edit; AI vs officer badges; original AI value retained when modified

**Still upcoming**

- Bind to real OCR/NLP extraction
- Field-level validation handoff

### Validation

**Shipped (2026-08-25)**

- Business-rule checks on the structured record: area, survey number, required fields, duplicate, transaction area, date consistency
- Each check: Passed, Warning, or Conflict
- Summary bar with counts and overall result
- Recomputes from current field values (including officer edits)

**Still upcoming**

- Auto-pass vs send-to-officer thresholds
- Persist validation outcomes onto document status
- Live LRMS duplicate query

### Reconciliation (key differentiator)

**Shipped (2026-08-25)**

- Side-by-side historical document vs mock government / LRMS holdings
- Example chain: original 5 acres, 1 acre sold, 4 acres remaining
- Explicit flag: whether the 1 acre transaction exists in the government database
- Results: MATCH, PARTIAL MATCH, CONFLICT, MISSING RECORD, DUPLICATE
- Visual area split and ownership / transaction timeline
- Seed documents cover each result type (mock data)

**Still upcoming**

- Live LRMS / government API compare
- Recommended resolution with officer commit

### Conflicts

**Shipped (2026-08-25)**

- Queue of conflicts from mock reconciliation
- Types: Ownership mismatch, Area mismatch, Missing transaction, Missing mutation, Duplicate record, Survey number mismatch, Invalid subdivision, GIS mismatch
- Columns: severity, record, conflicting values, reason, evidence
- Actions: Review, Compare (opens Reconciliation), Assign Officer, Resolve, Escalate

**Still upcoming**

- Persist resolutions into verification / master record
- Mandatory remarks on resolve / escalate

### Verification

**Shipped (2026-08-25)**

- Single officer screen: original document, mock OCR, structured record, government record, reconciliation result, conflicts
- Actions: Approve, Edit, Reject, Resolve Conflict, Request Document, Escalate
- AI recommendation is advisory; officer decision is final (including override)
- Remarks required for Reject, Request Document, Escalate
- Activity timeline (system / AI / officer)

**Still upcoming**

- Mandatory structured remarks codes for audit export
- Write-back of approvals into the master land database

### Land Records

**Shipped (2026-08-25)**

- Searchable mock master parcels (owner, survey number, village, status)
- Table: Owner, Survey Number, Area, Village, Status, Last Updated
- Click a row for complete history: previous owners, transactions, mutations, linked documents
- Includes 5 acre → 1 acre sale → 4 acre remainder holdings

**Still upcoming**

- Persist officer-approved records into this master from Verification
- Export / live LRMS handoff

### GIS Map

**Shipped (2026-08-25)**

- Mock cadastral / FMB sheet (SVG, not georeferenced)
- Click parcel: survey number, owner, area, village, transactions, record status, conflicts
- Conflict parcels hatched in red (5→1→4 remainder, duplicate parent, Selvam ownership)

**Still upcoming**

- Live LRMS / GIS endpoints
- True georeferenced overlay

### Audit Logs

**Shipped (2026-08-25)**

- Append-only mock trail of AI, officer, and system actions
- Columns: time, user, action, record, old value, new value
- Examples: document uploaded, classification/OCR completed, record modified, conflict detected, officer approved, database updated
- Record version history on master parcels
- Revert for the authorized officer session (writes a new version + new log rows)

**Still upcoming**

- Live write from every pipeline module
- Export for compliance

### Settings

- Roles and permissions (Officer, Senior Officer, Administrator — typed in auth; UI later)
- Integration config (LRMS, GIS, storage)
- Thresholds for confidence and auto-validation
- District / office context

### Final demo page

**Shipped (2026-08-25)**

- `/demo` — Live Demo cards in pipeline order
- Each card opens the live module route
- Intended URL for the closing PPT slide

---

## Current file map

```
src/
  proxy.ts                     Auth gate (redirect to /login)
  app/
    layout.tsx                 Root layout + AppProviders
    login/page.tsx             Government officer login
    forgot-password/page.tsx   Mock password assistance
    page.tsx                   Dashboard (mock operational data)
    demo/page.tsx              Live Demo walkthrough index
    documents/page.tsx         Documents workspace
    classification/page.tsx    Classification workspace
    preprocessing/page.tsx     OpenCV mock preprocessing
    extraction/page.tsx        Same preprocessing workspace (OCR later)
    structured-record/page.tsx Structured land record
    validation/page.tsx        Business-rule validation
    reconciliation/page.tsx    Historical vs government compare
    conflicts/page.tsx         Conflict queue
    verification/page.tsx      Officer case workspace
    land-records/page.tsx      Master land records
    gis-map/page.tsx           Mock cadastral map
    audit-logs/page.tsx        Audit trail + versions
    settings/page.tsx
    globals.css                Dark GovTech tokens
  components/
    layout/                    Sidebar, navbar, shell
    dashboard/                 Operational overview + FastAPI status
    auth/                      Login and forgot-password forms
    documents/                 Upload area, table, status badge
    classification/            Queue, preview, AI result panel
    preprocessing/             Stage preview, stepper, quality
    structured-record/         Editable land record sections
    validation/                Summary + rule check table
    reconciliation/            Compare cards, area split, timeline
    conflicts/                 Queue table + officer actions
    verification/              Case workspace
    land-records/              Search table + history panel
    gis-map/                   Parcel map + detail panel
    audit-logs/                Event table + version revert
  lib/
    navigation.ts              Nav items / routes
    auth.ts                    Roles, demo officer, session cookie
    auth-store.tsx             Login / logout session state
    dashboard.ts               Mock operational KPIs and feeds
    demo.ts                    Live Demo card list
    documents.ts               Document types, statuses, seeds
    documents-store.tsx        Queue state + mock pipeline
    classification.ts          Record types + mock AI classification
    preprocessing.ts           OpenCV stages + mock quality
    structured-record.ts       Mock clean record + officer edits
    validation.ts              Business-rule checks on structured records
    reconciliation.ts          Mock LRMS compare + ownership timeline
    conflicts.ts               Conflict types derived from reconciliation
    conflicts-store.tsx        Officer action state for conflicts
    ocr-mock.ts                Mock OCR text from structured fields
    verification.ts            AI recommendation (advisory)
    verification-store.tsx     Officer decisions + activity timeline
    master-records.ts          Mock master parcels + search
    gis-map.ts                 Mock cadastral polygons + GIS conflicts
    audit.ts                   Mock audit events + record versions
    audit-store.tsx            Session-persisted log + revert
    api.ts                     FastAPI base URL (localhost:8000)
backend/
  main.py                      FastAPI app, CORS, GET/POST /items
  requirements.txt
```

Nav labels and hrefs live in `src/lib/navigation.ts`. Add new modules there so the sidebar stays in sync.

---

## UI tokens

Defined in `src/app/globals.css`:

| Token | Use |
| --- | --- |
| `tl-bg` | Page background |
| `tl-sidebar` | Sidebar background |
| `tl-panel` | Cards / navbar |
| `tl-border` | Dividers |
| `tl-text` | Primary text |
| `tl-muted` | Secondary text |
| `tl-gold` | Active nav, official accent |

---

## Run locally

```bash
cd /Users/aadhiseshan_m/Documents/terralens
npm run dev
```

In a second terminal:

```bash
cd /Users/aadhiseshan_m/Documents/terralens/backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Open [http://localhost:3000](http://localhost:3000). API docs: [http://localhost:8000/docs](http://localhost:8000/docs). Unauthenticated visitors are sent to `/login`. Live Demo (PPT): [http://localhost:3000/demo](http://localhost:3000/demo).

```bash
npm run build   # production build
npm run start   # serve production build
```

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-08-25 | Project brief captured. Next.js + TypeScript + Tailwind scaffold. Dark dashboard layout, sidebar, top navbar, main area, and shell routes for all listed modules. No processing functionality yet. This status file added. |
| 2026-08-25 | Documents module: officer upload (PDF, image, scan), queue table, mock status pipeline. No OCR. |
| 2026-08-25 | Classification module: document preview, mock AI type/confidence/alternatives/language, Accept Classification and Send for Manual Review. |
| 2026-08-25 | Preprocessing module: mock OpenCV pipeline (deskew → denoise → enhancement → text restoration), before/after preview, status, and quality. |
| 2026-08-25 | Preprocessing workspace also shown on Extraction; mock pipeline auto-starts for idle documents. |
| 2026-08-25 | Structured Record module: Property/Owner/Location/Transaction/History tables with confidence, source page, officer edit, AI vs officer origin. |
| 2026-08-25 | Validation module: mock business rules (area, survey no., required fields, duplicate, transaction area, dates) with Passed/Warning/Conflict and a summary. |
| 2026-08-25 | Reconciliation module: historical vs mock LRMS, 5→1→4 acre chain, MATCH/PARTIAL/CONFLICT/MISSING/DUPLICATE, ownership timeline. |
| 2026-08-25 | Conflicts module: eight conflict types from reconciliation, severity/evidence table, Review/Compare/Assign/Resolve/Escalate. |
| 2026-08-25 | Verification module: single officer screen with source, OCR, structured record, LRMS, recon, conflicts, AI recommendation, decisions, activity timeline. |
| 2026-08-25 | Land Records module: searchable mock master file with history (owners, transactions, mutations, linked documents). |
| 2026-08-25 | Audit Logs module: AI/officer/system activity table, version history, authorized revert (append-only). |
| 2026-08-25 | GIS Map module: mock cadastral parcels, click-through details, conflict highlighting. |
| 2026-08-25 | Live Demo page at `/demo` with cards linking to every module (PPT closing slide). |
| 2026-08-25 | Mock government officer login, session, logout, roles, and protected routes. |
| 2026-08-25 | Live Demo removed from Operations sidebar. Dashboard filled with mock operational data. |
| 2026-08-25 | FastAPI backend in `backend/` with CORS; Dashboard GET/POST `/items` example. |

When a later prompt ships a feature, mark the module **Done** (or partial) in **Build status**, tick the matching items under **Upcoming features**, and add a changelog row.
