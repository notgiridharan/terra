"""
TerraLens Government & GIS REST API Router (v1)
================================================
Provides enterprise REST API endpoints to:
1. Store and query Input Document Images (Paths / URLs)
2. Store and query Output Information (Structured Fields & Verbatim OCR Text)
3. Store and export Spatial GIS Layers (GeoJSON, PostGIS Polygon Geometry, Coordinates)
4. Perform bulk sync with existing government land registry databases
"""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from db_models import LandRecordDB
from ocr_service import UPLOADS_DIR
from schemas import (
    LandRecordCreate,
    LandRecordResponse,
    BatchIngestRequest,
    GeoJSONFeatureCollection,
)

router = APIRouter(prefix="/api/v1", tags=["Government & GIS APIs"])


def _delete_record_files(record: LandRecordDB) -> None:
    """
    Best-effort cleanup of every file persisted on disk for a land record —
    the original upload, the preprocessed copy, and any real OpenCV
    pipeline stage images — so deleting a record doesn't leave orphaned
    files behind in backend/uploads/.
    """
    candidates: list[Path] = []
    if record.image_url:
        candidates.append(UPLOADS_DIR / Path(record.image_url).name)

    meta = record.ocr_metadata or {}
    preprocessed_url = meta.get("preprocessed_url")
    if preprocessed_url:
        candidates.append(UPLOADS_DIR / Path(preprocessed_url).name)

    for path in candidates:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass

    stage_dir = UPLOADS_DIR / "preprocess" / str(record.id)
    if stage_dir.exists():
        shutil.rmtree(stage_dir, ignore_errors=True)


# ---------------------------------------------------------------------------
# 1. Create / Ingest Single Land Record (Image + Outputs + GIS)
# ---------------------------------------------------------------------------
@router.post(
    "/records",
    response_model=LandRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest land record (Image + Output Info + GIS)",
    description="Ingests input document image path/URL, extracted output information, and GIS spatial features into PostgreSQL+PostGIS / SQLite.",
)
def create_record(record_in: LandRecordCreate, db: Session = Depends(get_db)):
    db_obj = LandRecordDB(**record_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj.to_dict()


# ---------------------------------------------------------------------------
# 2. Query / Search Land Records (Multilingual Search API)
# ---------------------------------------------------------------------------
@router.get(
    "/records",
    response_model=list[LandRecordResponse],
    summary="Search & query land records",
    description="Query records by Patta No, Survey No, Owner Name, District, Taluk, Village or Govt External ID.",
)
def query_records(
    patta_no: Optional[str] = Query(None, description="Patta Number"),
    survey_no: Optional[str] = Query(None, description="Survey / Khasra Number"),
    owner_name: Optional[str] = Query(None, description="Owner Name (partial match supported)"),
    district: Optional[str] = Query(None, description="District"),
    taluk: Optional[str] = Query(None, description="Taluk / Tehsil"),
    village: Optional[str] = Query(None, description="Revenue Village"),
    external_gov_id: Optional[str] = Query(None, description="Government Registry ID"),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(LandRecordDB)

    if patta_no:
        query = query.filter(LandRecordDB.patta_no.ilike(f"%{patta_no}%"))
    if survey_no:
        query = query.filter(LandRecordDB.survey_no.ilike(f"%{survey_no}%"))
    if owner_name:
        query = query.filter(LandRecordDB.owner_name.ilike(f"%{owner_name}%"))
    if district:
        query = query.filter(LandRecordDB.district.ilike(f"%{district}%"))
    if taluk:
        query = query.filter(LandRecordDB.taluk.ilike(f"%{taluk}%"))
    if village:
        query = query.filter(LandRecordDB.village.ilike(f"%{village}%"))
    if external_gov_id:
        query = query.filter(LandRecordDB.external_gov_id == external_gov_id)

    records = query.order_by(LandRecordDB.id.desc()).offset(offset).limit(limit).all()
    return [r.to_dict() for r in records]


# ---------------------------------------------------------------------------
# 3. Get Single Record by ID
# ---------------------------------------------------------------------------
@router.get(
    "/records/{record_id}",
    response_model=LandRecordResponse,
    summary="Get land record by ID",
)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(LandRecordDB).filter(LandRecordDB.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Land record {record_id} not found")
    return record.to_dict()


# ---------------------------------------------------------------------------
# 4. Update Land Record
# ---------------------------------------------------------------------------
@router.put(
    "/records/{record_id}",
    response_model=LandRecordResponse,
    summary="Update land record",
)
def update_record(record_id: int, record_in: LandRecordCreate, db: Session = Depends(get_db)):
    record = db.query(LandRecordDB).filter(LandRecordDB.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Land record {record_id} not found")

    update_data = record_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record.to_dict()


# ---------------------------------------------------------------------------
# 5. Delete Land Record
# ---------------------------------------------------------------------------
@router.delete(
    "/records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete land record",
)
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(LandRecordDB).filter(LandRecordDB.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Land record {record_id} not found")
    _delete_record_files(record)
    db.delete(record)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# 6. Bulk Government Database Batch Sync Endpoint
# ---------------------------------------------------------------------------
@router.post(
    "/records/batch",
    summary="Bulk ingest land records",
    description="Allows external government databases to push batch records in a single API call.",
)
def batch_ingest(payload: BatchIngestRequest, db: Session = Depends(get_db)):
    created_ids = []
    for r_in in payload.records:
        db_obj = LandRecordDB(**r_in.dict())
        db.add(db_obj)
        db.flush()
        created_ids.append(db_obj.id)
    db.commit()
    return {
        "success": True,
        "count": len(created_ids),
        "created_ids": created_ids,
        "message": f"Successfully ingested {len(created_ids)} records.",
    }


# ---------------------------------------------------------------------------
# 7. GIS GeoJSON Spatial Layer Export API
# ---------------------------------------------------------------------------
@router.get(
    "/gis/geojson",
    response_model=GeoJSONFeatureCollection,
    summary="Export GIS Spatial Layer in GeoJSON format",
    description="Returns standard GeoJSON FeatureCollection compatible with QGIS, ArcGIS, Mapbox, Leaflet, and Govt GIS Portals.",
)
def export_geojson(
    district: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(LandRecordDB)
    if district:
        query = query.filter(LandRecordDB.district.ilike(f"%{district}%"))
    if village:
        query = query.filter(LandRecordDB.village.ilike(f"%{village}%"))

    records = query.all()
    features = []

    for r in records:
        geom = r.geojson_geometry
        if not geom and r.latitude is not None and r.longitude is not None:
            geom = {
                "type": "Point",
                "coordinates": [r.longitude, r.latitude],
            }

        if geom:
            features.append({
                "type": "Feature",
                "id": r.id,
                "geometry": geom,
                "properties": {
                    "patta_no": r.patta_no,
                    "survey_no": r.survey_no,
                    "owner_name": r.owner_name,
                    "district": r.district,
                    "taluk": r.taluk,
                    "village": r.village,
                    "land_type": r.land_type,
                    "land_area_ha": r.land_area_hectare,
                    "land_area_acres": r.land_area_acres,
                    "source_filename": r.source_filename,
                    "image_url": r.image_url,
                    "external_gov_id": r.external_gov_id,
                },
            })

    return {
        "type": "FeatureCollection",
        "features": features,
    }
