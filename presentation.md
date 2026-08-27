# 🏛️ TerraLens — Project Presentation & Comprehensive Overview

> **Project Name:** TerraLens — AI-Powered Land Record Intelligence, Multilingual OCR, Document Forensics & Spatial GIS Platform  
> **Target Sector:** Indian Government Land Governance, Revenue Departments & Legal Property Verification  
> **Key Technologies:** Next.js 16 (React), Tailwind CSS, Python FastAPI, SQLite / PostgreSQL + PostGIS, Gemini Multimodal Vision API, OpenCV, PaddleOCR.

---

## 📑 Presentation Script (Split for 6 Team Members)

This presentation script is formatted so that 6 speakers can present the project smoothly to a panel of judges/juries in under 10–12 minutes.

---

### 🎙️ Speaker 1: Introduction & Problem Statement
**Focus:** The Problem, Vision, Executive Overview & System Architecture

- **Script:**
  > *"Good morning respected judges and panel members. Today, we are proud to introduce **TerraLens** — an AI-powered Land Record Intelligence, Multilingual OCR, Document Forensics, and Spatial GIS Platform tailored specifically for Indian land records such as Patta, Chitta, Khasra, Khatauni, and Sale Deeds.*
  >
  > *In India, land governance faces massive challenges: historical records are often handwritten in regional languages like Tamil or Hindi, scanned from old yellowed paper, or physically damaged. On top of that, land fraud — such as forging stamps, splicing deed text, or transferring property registered under deceased owners — costs citizens and revenue departments billions in legal disputes.*
  >
  > *TerraLens solves this end-to-end. We combine cutting-edge Multimodal AI Vision, computer vision document forensics, spatial GIS databases, and a modern officer dashboard to make land record verification fast, automated, and tamper-proof. I will now hand over to Speaker 2 to explain our Multilingual AI OCR and Field Extraction Engine."*

---

### 🎙️ Speaker 2: AI OCR & Multilingual Field Extraction
**Focus:** Multimodal Gemini Vision, Local PaddleOCR Fallback & Image Preprocessing

- **Script:**
  > *"Thank you, Speaker 1. At the core of TerraLens is our **Multilingual AI OCR and Extraction Engine**.*
  >
  > *Our primary pipeline uses **Gemini Multimodal Vision**. Instead of relying purely on character recognition, Gemini reads document pixels directly, understanding context even when text is faded, skewed, or written in complex Tamil, Hindi, or English scripts.*
  >
  > *If network access is limited, TerraLens seamlessly falls back to a **Local PaddleOCR Engine** boosted by an advanced **OpenCV Preprocessing Pipeline**. This pipeline applies **CLAHE Contrast Enhancement** to revive faded ink, **Bilateral Denoising** to remove background noise while keeping text edges sharp, and **Bicubic Upscaling** for low-res phone scans.*
  >
  > *From every uploaded document, we automatically extract **12 structured legal fields** — including Document Type, Patta Number, Survey/Khasra Number, Owner Name, Father/Husband Name, District, Taluk, Village, Land Type, Area in Hectares/Acres, and Land Valuation, alongside verbatim raw text transcription. Now Speaker 3 will walk you through our Document Forensics and Fraud Detection capabilities."*

---

### 🎙️ Speaker 3: Advanced Document Forensics & Fraud Prevention
**Focus:** ELA (Error Level Analysis), Stamp/Signature CV Detection & Deceased Owner Loophole Protection

- **Script:**
  > *"Thank you, Speaker 2. Extracting data is only half the battle — ensuring document authenticity is critical. TerraLens includes a multi-layered **Document Forensics & Fraud Detection Engine**.*
  >
  > *First, we implement **Digital Splice Detection using Error Level Analysis (ELA)**. ELA analyzes compression grid differentials across the image to immediately flag spliced text — for instance, if a fraudster pasted a fake survey number or owner name onto a legitimate old deed.*
  >
  > *Second, we perform **Wet-Ink Stamp & Signature Detection** using OpenCV HSV color-space analysis and morphological contour extraction. The system automatically locates, counts, and visually bounds official blue, red, and purple government seals and signature ink.*
  >
  > *Third, we address the critical **Pre-2018 Deceased Owner Loophole**. TerraLens cross-references extracted owner names against a Civil Death Registry (*Jeevan Pramaan*). If a transfer is attempted on a deceased owner's property, the system triggers a **Hard-Stop Transfer Block**, marking the record as `HIGH_RISK` and mandating a verified Legal Heir Certificate (*Varisu Sannidhi*) before any transaction proceeds. Let us pass to Speaker 4 to discuss Database and GIS Architecture."*

---

### 🎙️ Speaker 4: Database Architecture & Spatial GIS Integration
**Focus:** SQLite / PostgreSQL + PostGIS, GeoJSON Standards & Spatial Mapping

- **Script:**
  > *"Thank you, Speaker 3. TerraLens is built on an enterprise-grade, resilient dual-database architecture using **SQLAlchemy and GeoAlchemy2**.*
  >
  > *For rapid local deployment and offline demonstrations, TerraLens operates zero-config on a persistent local **SQLite database (`terralens.db`)**. Every uploaded document, parsed JSON field, image asset, and forensic audit score is automatically persisted across sessions without data loss.*
  >
  > *For enterprise government deployments, updating a single `DATABASE_URL` environment variable connects TerraLens to **PostgreSQL + PostGIS**. This unlocks full spatial GIS capabilities, storing parcel boundary GeoJSON Polygons, GPS point coordinates, and enabling spatial queries like `ST_Contains` or `ST_Intersects`.*
  >
  > *Every land record is linked with spatial boundaries that can be exported in standard GeoJSON format directly into QGIS, ArcGIS, Mapbox, or Leaflet. Now, Speaker 5 will cover Government REST APIs and Interoperability."*

---

### 🎙️ Speaker 5: Government REST APIs & System Interoperability
**Focus:** `/api/v1/records`, Batch Ingest, Search & Integration Standard

- **Script:**
  > *"Thank you, Speaker 4. TerraLens is designed to be an interoperable core module for state land governance rather than an isolated application.*
  >
  > *We provide a complete **Government RESTful CRUD API (`/api/v1/records`)** built with FastAPI. Existing state land registries can search, query, update, create, or delete land records programmatically.*
  >
  > *Key API endpoints include:*
  > 1. `POST /api/ocr` — High-speed document OCR, forensics, and auto-database indexing.
  > 2. `GET /api/v1/records` — Multilingual search filtering by Patta No, Survey No, Owner Name, District, Taluk, or Village.
  > 3. `POST /api/v1/records/batch` — High-volume batch ingestion for state-wide digitisation campaigns.
  > 4. `GET /api/v1/gis/geojson` — Real-time spatial GeoJSON boundary streaming.
  >
  > *This allows seamless integration with existing portals like Tamil Nadu’s Patta/Chitta portal, Karnataka’s Bhoomi, or national land records portals. I will now hand over to Speaker 6 to present the User Experience and conclusion."*

---

### 🎙️ Speaker 6: Frontend UX, Officer Workspace & Summary
**Focus:** Next.js 16 Dashboard, Live Officer Workflows, Summary & Closing Statement

- **Script:**
  > *"Thank you, Speaker 5. To present all this power to land revenue officers, we designed a modern **Next.js 16 Glassmorphism Dashboard**.*
  >
  > *The frontend provides specialized officer workspaces:*
  > - **Ingest Workspace**: Drag-and-drop document upload with real-time status tracking and record deletion tools.
  > - **Forensic Compliance Panel**: Real-time visual risk badges (`CLEAN` vs `HIGH RISK DETECTED`), interactive ELA anomaly meters, physical stamp count badges, and hard-stop legal warnings.
  > - **GIS Map Workspace**: Interactive parcel visualizer rendering land boundaries and historical transaction lineages.
  > - **Structured Record & Reconciliation Views**: Instant copy-to-clipboard fields, side-by-side deed comparison, and complete audit log trails.
  >
  > *In summary, TerraLens turns slow, error-prone, fraud-vulnerable manual record checking into a multi-second, AI-assisted, fraud-proof workflow. Thank you for your time, and we are now open to any questions from the jury!"*

---

## 🛠️ Complete Technology Stack Summary

| Layer | Technology Used | Purpose / Use Case |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Modern SSR/CSR web framework for hyper-fast page rendering & modular architecture. |
| **UI Styling** | **Tailwind CSS + Glassmorphism** | Dark-mode premium officer UI, high-contrast badges, responsive layout design. |
| **Icons & Design** | **Lucide React** | Modern iconography for status badges, forensic indicators, and map controls. |
| **Backend Framework** | **Python FastAPI** | Asynchronous, high-performance REST API backend with automatic Swagger documentation. |
| **Primary AI OCR** | **Google Gemini Multimodal Vision** | Direct image-to-JSON understanding for regional Indian languages (Tamil, Hindi, English). |
| **Fallback OCR Engine** | **PaddleOCR (PP-OCRv5)** | Local offline OCR recognition fallback when cloud network is restricted. |
| **Computer Vision** | **OpenCV (cv2) & PIL** | Image CLAHE enhancement, bilateral denoising, bicubic upscaling, and HSV stamp detection. |
| **Forensics** | **Error Level Analysis (ELA)** | Digital image compression differential analysis to spot copy-paste image tamperings. |
| **Database ORM** | **SQLAlchemy 2.0 & GeoAlchemy2** | Enterprise database mapping supporting both SQLite and PostgreSQL + PostGIS. |
| **Local Database** | **SQLite (`terralens.db`)** | Zero-config, persistent file-based database out-of-the-box for offline demo and state persistence. |
| **Enterprise Database** | **PostgreSQL + PostGIS Extension** | Spatial GIS storage for GeoJSON Polygons, spatial coordinates (`ST_Contains`, `ST_Intersects`). |
| **GIS Standards** | **GeoJSON Standard** | Interoperable spatial data format compatible with QGIS, ArcGIS, Mapbox, and Leaflet. |

---

## 🌟 Feature Breakdown & Utility Quick-Reference

| Feature Name | Description & Purpose | Why It Matters / Business Value |
| :--- | :--- | :--- |
| **1. Direct Gemini Vision OCR** | Uses multimodal vision AI to parse text straight from document pixels. | Reads damaged, skewed, or faded Tamil/Hindi documents where traditional OCR fails. |
| **2. OpenCV CLAHE & Denoising** | Image enhancement pipeline applying local contrast boost & bilateral smoothing. | Cleans up low-quality phone photos taken by officers in rural offices. |
| **3. 12-Field Extraction** | Extracts Patta No, Survey No, Owner, Father Name, Village, Land Type, Area, etc. | Converts unstructured paper images into queryable SQL database records automatically. |
| **4. Error Level Analysis (ELA)** | Analyzes image compression rates to identify digital manipulation. | Prevents fraudsters from editing survey numbers or names using photo editing software. |
| **5. Wet-Ink Stamp Detection** | Computer vision HSV color filter that counts official seals and signatures. | Verifies physical authorization assets on government documents. |
| **6. Deceased Owner Hard-Stop** | Cross-references owner names against a death registry (*Jeevan Pramaan*). | Blocks illegal property transfers on deceased citizens' lands unless a Heir Certificate is present. |
| **7. Dual-Database Engine** | Runs on local SQLite out-of-the-box; switches to PostgreSQL + PostGIS via `.env`. | Works offline for quick setup while being production-ready for government data centers. |
| **8. Record Deletion & CRUD** | Real-time database synchronisation allowing records to be added, edited, or deleted. | Gives officers total control over queue management and dataset sanitation. |
| **9. GeoJSON API Stream** | Serves parcel polygon boundaries via REST endpoints (`/api/v1/gis/geojson`). | Plugs directly into standard GIS software like QGIS, ArcGIS, Mapbox, or Leaflet. |
| **10. Forensic Officer Panel** | UI workspace displaying real-time risk scores, badge alerts, and field edits. | Provides land officers an intuitive decision-support system to approve or flag deeds. |

---

## ❓ Anticipated Jury Questions & Answers (FAQ)

1. **Q: How does TerraLens handle regional Indian languages like Tamil and Hindi?**
   - **Answer:** We use a dual-stage approach: Gemini Multimodal Vision understands Tamil and Hindi scripts contextually directly from pixels. For offline fallback, PaddleOCR uses specialized multilingual language models (`ta`, `hi`, `en`) combined with regex-based post-processing tuned for Tamil Nadu and North Indian land terminology.

2. **Q: What happens if the internet connection goes down?**
   - **Answer:** TerraLens is built to run offline. When offline or when cloud access is restricted, the system uses local PaddleOCR + OpenCV computer vision for field extraction and ELA forensics, storing all data in the local persistent SQLite database (`terralens.db`).

3. **Q: How does ELA (Error Level Analysis) detect forgery?**
   - **Answer:** When an image is saved as a JPEG, it undergoes uniform compression. If someone edits a document in Photoshop (e.g., pasting a new name or altering a survey number), that newly pasted section will have a different error level than the surrounding image. ELA highlights these compression differentials as bright anomalies.

4. **Q: Can TerraLens integrate with existing government systems?**
   - **Answer:** Yes! TerraLens exposes a complete RESTful API built on FastAPI (`/api/v1/records`). State governments can integrate it using standard JSON payloads and import/export spatial boundaries via GeoJSON.
