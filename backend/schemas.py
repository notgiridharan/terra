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


# ---------------------------------------------------------------------------
# Land Records Validation Engine schemas
# ---------------------------------------------------------------------------


class SubDivision(BaseModel):
    survey_no: Optional[str] = None
    area: Optional[float] = None


class ValidateRecordRequest(BaseModel):
    """Flat structured-record payload the validation engine checks. All
    fields are optional — individual rules degrade to a WARNING when the
    data they need is missing rather than erroring out."""

    record_id: Optional[int] = Field(None, description="Existing land_records.id, used for duplicate/chain lookups and to exclude self-matches.")

    document_type: Optional[str] = None
    survey_no: Optional[str] = None
    khata_no: Optional[str] = None
    patta_no: Optional[str] = None
    owner_name: Optional[str] = None
    owner_father_or_son_name: Optional[str] = None
    district: Optional[str] = None
    taluk: Optional[str] = None
    village: Optional[str] = None

    land_area_hectare: Optional[str] = None
    land_area_acres: Optional[str] = None
    land_amount_or_value: Optional[str] = None
    parent_area_hectare: Optional[float] = Field(None, description="Registered parent-plot area, for transaction/sub-division sum checks.")
    sub_divisions: Optional[list[SubDivision]] = None

    prev_owner: Optional[str] = None
    seller_name: Optional[str] = None
    reg_date: Optional[str] = Field(None, description="dd/mm/yyyy or yyyy-mm-dd")
    mutation_date: Optional[str] = None
    order_date: Optional[str] = None
    issue_date: Optional[str] = None


class RuleOutcome(BaseModel):
    rule_id: str
    status: str
    severity: str
    description: str
    evidence: str
    fields: list[str]


class ValidationResult(BaseModel):
    overall: str
    total_checks: int
    passed: int
    warning: int
    conflict: int
    results: list[RuleOutcome]

    # Officer-facing four-tier verdict
    verdict: str = Field(..., description="VERIFIED | VERIFIED_WITH_EXCEPTIONS | REQUIRES_MANUAL_VERIFICATION | REJECTED_INVALID")
    confidence: int = Field(..., description="0-100 confidence score behind the verdict")
    records_checked: int
    records_matched: int
    historical_chain: str = Field(..., description="Complete | Incomplete | Broken | Not Applicable")
    land_dna: str = Field(..., description="Consistent | Minor Variance | Inconsistent")
