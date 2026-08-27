"""
TerraLens Database Models
=========================
Defines the comprehensive schema for storing:
1. Input document images (URL path & optional Base64 blob)
2. Extracted output information (Structured Fields & Verbatim Raw OCR Text)
3. Spatial GIS Features (GeoJSON geometry, Coordinates, PostGIS boundary)
4. OCR Metadata & Provenance (Language, processing time, bounding boxes)
"""

from __future__ import annotations

import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from database import Base, IS_POSTGRES

# Optional GeoAlchemy2 for PostGIS spatial geometry
try:
    from geoalchemy2 import Geometry  # type: ignore
    GEO_AVAILABLE = True
except ImportError:
    GEO_AVAILABLE = False


class LandRecordDB(Base):
    __tablename__ = "land_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # -----------------------------------------------------------------------
    # 1. INPUT IMAGE DATA (Scanned documents, photos, PDFs)
    # -----------------------------------------------------------------------
    source_filename = Column(String(255), nullable=True)  # original uploaded filename
    image_url = Column(String(500), nullable=True)       # accessible URL e.g. /uploads/abc123.jpg
    image_base64 = Column(Text, nullable=True)           # optional base64 encoded image string

    # -----------------------------------------------------------------------
    # 2. OUTPUT INFORMATION (Extracted Structured Fields & Raw Text)
    # -----------------------------------------------------------------------
    document_type = Column(String(100), index=True, nullable=True)  # Patta, Chitta, Khasra, Sale Deed
    patta_no = Column(String(100), index=True, nullable=True)
    survey_no = Column(String(100), index=True, nullable=True)
    district = Column(String(100), index=True, nullable=True)
    taluk = Column(String(100), index=True, nullable=True)
    village = Column(String(100), index=True, nullable=True)

    owner_name = Column(String(255), index=True, nullable=True)
    owner_father_or_son_name = Column(String(255), nullable=True)

    land_type = Column(String(100), nullable=True)  # Wet / Dry / Agricultural / Commercial
    land_area_hectare = Column(String(50), nullable=True)
    land_area_acres = Column(String(50), nullable=True)
    land_amount_or_value = Column(String(50), nullable=True)

    raw_text = Column(Text, nullable=True)            # verbatim OCR output transcription
    parsed_fields_json = Column(JSON, nullable=True)  # full output dictionary JSON

    # -----------------------------------------------------------------------
    # 3. SPATIAL / GIS DATA (GeoJSON & PostGIS Spatial Geometry)
    # -----------------------------------------------------------------------
    geojson_geometry = Column(JSON, nullable=True)  # GeoJSON Polygon / Point geometry feature
    latitude = Column(Float, nullable=True)         # Latitude coordinate
    longitude = Column(Float, nullable=True)        # Longitude coordinate

    # -----------------------------------------------------------------------
    # 4. OCR METADATA & PROVENANCE
    # -----------------------------------------------------------------------
    ocr_language = Column(String(20), default="ta")
    detected_lang = Column(String(20), nullable=True)
    processing_ms = Column(Integer, nullable=True)
    ocr_metadata = Column(JSON, nullable=True)      # execution details, confidence, bounding boxes

    # -----------------------------------------------------------------------
    # 5. GOVERNMENT / EXTERNAL SYSTEM INTEGRATION
    # -----------------------------------------------------------------------
    external_gov_id = Column(String(100), index=True, nullable=True)  # State land registry ID
    sync_status = Column(String(50), default="SYNCED", index=True)

    # -----------------------------------------------------------------------
    # TIMESTAMPS
    # -----------------------------------------------------------------------
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "input_image": {
                "source_filename": self.source_filename,
                "image_url": self.image_url,
                "has_base64": bool(self.image_base64),
            },
            "output_information": {
                "document_type": self.document_type,
                "patta_no": self.patta_no,
                "survey_no": self.survey_no,
                "owner_name": self.owner_name,
                "owner_father_or_son_name": self.owner_father_or_son_name,
                "district": self.district,
                "taluk": self.taluk,
                "village": self.village,
                "land_type": self.land_type,
                "land_area_hectare": self.land_area_hectare,
                "land_area_acres": self.land_area_acres,
                "land_amount_or_value": self.land_amount_or_value,
                "raw_text": self.raw_text,
                "parsed_fields": self.parsed_fields_json or {},
            },
            "gis_spatial_data": {
                "geojson_geometry": self.geojson_geometry,
                "latitude": self.latitude,
                "longitude": self.longitude,
            },
            "ocr_metadata": {
                "ocr_language": self.ocr_language,
                "detected_lang": self.detected_lang,
                "processing_ms": self.processing_ms,
                "extra": self.ocr_metadata,
            },
            "government_integration": {
                "external_gov_id": self.external_gov_id,
                "sync_status": self.sync_status,
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
