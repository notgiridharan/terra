"""
TerraLens API Pydantic Schemas
==============================
Defines request and response schemas for REST API integration with external government systems,
including input image reference, output information, and GIS spatial attributes.
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class ParsedFieldsSchema(BaseModel):
    document_type: Optional[str] = Field(None, example="Patta")
    patta_no: Optional[str] = Field(None, example="142/3")
    survey_no: Optional[str] = Field(None, example="72/A")
    owner_name: Optional[str] = Field(None, example="R. Ramasamy")
    owner_father_or_son_name: Optional[str] = Field(None, example="S. Gopal")
    district: Optional[str] = Field(None, example="Madurai")
    taluk: Optional[str] = Field(None, example="Melur")
    village: Optional[str] = Field(None, example="Othakadai")
    land_type: Optional[str] = Field(None, example="Dry Land (புஞ்சை)")
    land_area_hectare: Optional[str] = Field(None, example="0.9100")
    land_area_acres: Optional[str] = Field(None, example="2.25")
    land_amount_or_value: Optional[str] = Field(None, example="450000")


class LandRecordCreate(BaseModel):
    # Input Image Data
    source_filename: Optional[str] = None
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

    # Output Extraction Info
    document_type: Optional[str] = None
    patta_no: Optional[str] = None
    survey_no: Optional[str] = None
    owner_name: Optional[str] = None
    owner_father_or_son_name: Optional[str] = None
    district: Optional[str] = None
    taluk: Optional[str] = None
    village: Optional[str] = None
    land_type: Optional[str] = None
    land_area_hectare: Optional[str] = None
    land_area_acres: Optional[str] = None
    land_amount_or_value: Optional[str] = None
    raw_text: Optional[str] = None
    parsed_fields_json: Optional[dict[str, Any]] = None

    # GIS Spatial Data
    geojson_geometry: Optional[dict[str, Any]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Metadata & Gov Integration
    ocr_language: Optional[str] = "ta"
    detected_lang: Optional[str] = "ta"
    processing_ms: Optional[int] = None
    ocr_metadata: Optional[dict[str, Any]] = None
    external_gov_id: Optional[str] = None


class LandRecordResponse(BaseModel):
    id: int
    input_image: dict[str, Any]
    output_information: dict[str, Any]
    gis_spatial_data: dict[str, Any]
    ocr_metadata: dict[str, Any]
    government_integration: dict[str, Any]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class BatchIngestRequest(BaseModel):
    records: list[LandRecordCreate]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: list[dict[str, Any]]
