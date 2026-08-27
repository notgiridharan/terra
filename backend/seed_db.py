"""
TerraLens Database Seeder
=========================
Populates the land records database with the initial master records (parcels, transactions,
mutation history) and document queue seed items, enabling live query and CRUD workflows.
"""

import os
from pathlib import Path
from sqlalchemy.orm import Session

# Load .env from parent directoy
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(_env_path, override=True)
except ImportError:
    pass

from database import SessionLocal, init_db
from db_models import LandRecordDB

# SVGs and histories corresponding to MASTER_PARCELS 
MASTER_PARCELS_DATA = [
    {
        "external_gov_id": "mlr-142-3-remain",
        "owner_name": "R. Venkatesan",
        "owner_father_or_son_name": "Late Ramasamy",
        "survey_no": "142/3",
        "land_area_acres": "4.00 acres",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
        "document_type": "Patta",
        "land_type": "Wet (Nanjai)",
        "sync_status": "Current",
        "ocr_metadata": {
            "map_shape": {
                "points": "58,198 412,184 428,368 72,382",
                "labelX": 230,
                "labelY": 278,
            },
            "history": {
                "previousOwners": [
                    {"name": "Late Ramasamy", "from": "1962", "to": "1984", "note": "Settlement holder prior to A-Register entry."},
                    {"name": "R. Venkatesan", "from": "1984", "to": "2009", "note": "Held undivided 5.00 acres before the 1 acre sale."}
                ],
                "transactions": [
                    {"date": "1984", "type": "Settlement", "from": "Late Ramasamy", "to": "R. Venkatesan", "area": "5.00 acres", "instrument": "A-Register 1984"},
                    {"date": "18 Mar 2009", "type": "Sale", "from": "R. Venkatesan", "to": "K. Meenakshi", "area": "1.00 acre", "instrument": "Sale deed DOC/2009/2144"}
                ],
                "mutations": [
                    {"number": "MUT/2009/118", "date": "02 Apr 2009", "effect": "Reduced parent holding from 5.00 to 4.00 acres", "order": "Tahsildar, Sirkazhi"}
                ],
                "linkedDocuments": [
                    {"title": "A-Register_Sirkazhi_1984.pdf", "kind": "A-Register", "href": "/structured-record"},
                    {"title": "Mutation_Khata_88.pdf", "kind": "Mutation", "href": "/reconciliation?doc=seed-mutation"},
                    {"title": "RoR_Block12_Sirkazhi.pdf", "kind": "RoR", "href": "/verification"}
                ]
            }
        }
    },
    {
        "external_gov_id": "mlr-142-3-sold",
        "owner_name": "K. Meenakshi",
        "owner_father_or_son_name": "R. Venkatesan",
        "survey_no": "142/3-B",
        "land_area_acres": "1.00 acre",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
        "document_type": "Patta",
        "land_type": "Wet (Nanjai)",
        "sync_status": "Current",
        "ocr_metadata": {
            "map_shape": {
                "points": "422,184 662,196 674,348 434,366",
                "labelX": 548,
                "labelY": 268,
            },
            "history": {
                "previousOwners": [
                    {"name": "R. Venkatesan", "from": "1984", "to": "2009", "note": "Seller of the 1 acre portion from the original 5 acre holding."}
                ],
                "transactions": [
                    {"date": "18 Mar 2009", "type": "Sale", "from": "R. Venkatesan", "to": "K. Meenakshi", "area": "1.00 acre", "instrument": "Sale deed DOC/2009/2144"}
                ],
                "mutations": [
                    {"number": "MUT/2009/118", "date": "02 Apr 2009", "effect": "Carved 1.00 acre in favour of K. Meenakshi", "order": "Tahsildar, Sirkazhi"}
                ],
                "linkedDocuments": [
                    {"title": "SaleDeed_Registration_2009.pdf", "kind": "Sale Deed", "href": "/reconciliation?doc=seed-deed"},
                    {"title": "Mutation_Khata_88.pdf", "kind": "Mutation", "href": "/reconciliation?doc=seed-mutation"}
                ]
            }
        }
    },
    {
        "external_gov_id": "mlr-142-parent-dup",
        "owner_name": "R. Venkatesan",
        "owner_father_or_son_name": "Late Ramasamy",
        "survey_no": "142/1",
        "land_area_acres": "5.00 acres",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
        "document_type": "Patta",
        "land_type": "Wet (Nanjai)",
        "sync_status": "Under dispute",
        "ocr_metadata": {
            "map_shape": {
                "points": "48,36 668,48 652,168 62,178",
                "labelX": 355,
                "labelY": 98,
            },
            "history": {
                "previousOwners": [
                    {"name": "Late Ramasamy", "from": "1962", "to": "1984", "note": "Settlement predecessor."}
                ],
                "transactions": [
                    {"date": "18 Mar 2009", "type": "Sale (disputed posting)", "from": "R. Venkatesan", "to": "K. Meenakshi", "area": "1.00 acre", "instrument": "Sale deed on historical file; parent patta not cancelled"}
                ],
                "mutations": [
                    {"number": "MUT/2009/118 (partial)", "date": "02 Apr 2009", "effect": "Child patta issued; parent 5.00 acre patta still live", "order": "Duplicate booking — 6.00 acres on register"}
                ],
                "linkedDocuments": [
                    {"title": "Patta_Survey_142.jpg", "kind": "Patta", "href": "/conflicts"},
                    {"title": "SaleDeed_Registration_2009.pdf", "kind": "Sale Deed", "href": "/reconciliation?doc=seed-deed"}
                ]
            }
        }
    },
    {
        "external_gov_id": "mlr-88-selvam",
        "owner_name": "P. Selvam",
        "owner_father_or_son_name": "R. Venkatesan",
        "survey_no": "88/2",
        "land_area_acres": "4.00 acres",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
        "document_type": "Patta",
        "land_type": "Dry (Punjai)",
        "sync_status": "Under dispute",
        "ocr_metadata": {
            "map_shape": {
                "points": "64,402 670,392 682,518 78,532",
                "labelX": 370,
                "labelY": 458,
            },
            "history": {
                "previousOwners": [
                    {"name": "R. Venkatesan", "from": "1984", "to": "2009", "note": "Historical remainder owner after 1 acre sale."}
                ],
                "transactions": [
                    {"date": "2009", "type": "Unexplained pattadar change", "from": "R. Venkatesan", "to": "P. Selvam", "area": "4.00 acres", "instrument": "No supporting deed on mock file"}
                ],
                "mutations": [
                    {"number": "Not posted", "date": "—", "effect": "LRMS names P. Selvam; historical chain does not", "order": "Ownership mismatch"}
                ],
                "linkedDocuments": [
                    {"title": "FMB_Village_Map_Ward3.tif", "kind": "FMB / GIS", "href": "/conflicts"}
                ]
            }
        }
    },
    {
        "external_gov_id": "mlr-nallur-12",
        "owner_name": "M. Lakshmi",
        "owner_father_or_son_name": "S. Rajendran",
        "survey_no": "12/1",
        "land_area_acres": "2.40 acres",
        "village": "Nallur",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
        "document_type": "Patta",
        "land_type": "Wet (Nanjai)",
        "sync_status": "Current",
        "ocr_metadata": {
            "map_shape": {
                "points": "58,552 278,546 286,628 64,632",
                "labelX": 168,
                "labelY": 590,
            },
            "history": {
                "previousOwners": [
                    {"name": "S. Rajendran", "from": "1991", "to": "2014", "note": "Gift settlement to daughter."}
                ],
                "transactions": [
                    {"date": "11 Jan 2014", "type": "Gift", "from": "S. Rajendran", "to": "M. Lakshmi", "area": "2.40 acres", "instrument": "Gift deed DOC/2014/088"}
                ],
                "mutations": [
                    {"number": "MUT/2014/044", "date": "28 Jan 2014", "effect": "Name change to M. Lakshmi", "order": "Tahsildar, Sirkazhi"}
                ],
                "linkedDocuments": [
                    {"title": "Chitta_Extract_2011.png", "kind": "Chitta", "href": "/structured-record"}
                ]
            }
        }
    },
    {
        "external_gov_id": "mlr-puthur-prov",
        "owner_name": "S. Rajendran",
        "owner_father_or_son_name": "Unknown",
        "survey_no": "201/4",
        "land_area_acres": "0.80 acre",
        "village": "Puthur",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
        "document_type": "Patta",
        "land_type": "Dry (Punjai)",
        "sync_status": "Provisional",
        "ocr_metadata": {
            "map_shape": {
                "points": "300,548 518,542 528,626 308,630",
                "labelX": 412,
                "labelY": 588,
            },
            "history": {
                "previousOwners": [
                    {"name": "Unknown (illegible settlement line)", "from": "—", "to": "2026", "note": "Awaiting officer verification of old settlement register."}
                ],
                "transactions": [],
                "mutations": [],
                "linkedDocuments": [
                    {"title": "Old settlement register (queued)", "kind": "Settlement", "href": "/documents"}
                ]
            }
        }
    },
    {
        "external_gov_id": "mlr-agaram-super",
        "owner_name": "K. Meenakshi",
        "owner_father_or_son_name": "Unknown",
        "survey_no": "55/2",
        "land_area_acres": "1.10 acres",
        "village": "Agaram",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
        "document_type": "Patta",
        "land_type": "Wet (Nanjai)",
        "sync_status": "Superseded",
        "ocr_metadata": {
            "map_shape": {
                "points": "542,544 778,538 792,622 552,628",
                "labelX": 665,
                "labelY": 584,
            },
            "history": {
                "previousOwners": [
                    {"name": "K. Meenakshi", "from": "2003", "to": "2021", "note": "Holding merged into a later subdivision."}
                ],
                "transactions": [
                    {"date": "09 Jan 2021", "type": "Subdivision merge", "from": "K. Meenakshi", "to": "K. Meenakshi", "area": "1.10 acres", "instrument": "Subdivision order SUB/2021/09"}
                ],
                "mutations": [
                    {"number": "MUT/2021/009", "date": "09 Jan 2021", "effect": "Parcel superseded by 55/2A", "order": "Survey / settlement wing"}
                ],
                "linkedDocuments": [
                    {"title": "Subdivision order SUB/2021/09", "kind": "Subdivision"}
                ]
            }
        }
    }
]

# Documents queue initial state
SEED_DOCUMENTS_DATA = [
    {
        "external_gov_id": "seed-ror-12",
        "source_filename": "RoR_Block12_Sirkazhi.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 2451200,
        "document_type": "RoR",
        "sync_status": "Uploaded",
        "owner_name": "R. Venkatesan",
        "survey_no": "12/2",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
    },
    {
        "external_gov_id": "seed-patta-142",
        "source_filename": "Patta_Survey_142.jpg",
        "mime_type": "image/jpeg",
        "size_bytes": 3870412,
        "document_type": "Patta",
        "sync_status": "Processing",
        "owner_name": "R. Venkatesan",
        "survey_no": "142/1",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
        "ocr_metadata": {
            "forensics": {
                "status": "HIGH_RISK",
                "is_suspicious": True,
                "ela": {"ela_score": 75, "is_suspicious": True, "status": "HIGH_RISK"},
                "assets": {"stamp_count": 0, "signature_count": 0, "status": "WARNING_NO_STAMP"},
                "lineage": {"status": "DECEASED_OWNER_FLAG", "message": "CRITICAL: Owner R. Ramasamy deceased prior to deed.", "requires_legal_heir_certificate": True, "severity": "HIGH_RISK"}
            }
        }
    },
    {
        "external_gov_id": "seed-fmb-map",
        "source_filename": "FMB_Village_Map_Ward3.tif",
        "mime_type": "image/tiff",
        "size_bytes": 18204160,
        "document_type": "FMB / GIS",
        "sync_status": "Classified",
        "owner_name": "P. Selvam",
        "survey_no": "88/2",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
    },
    {
        "external_gov_id": "seed-chitta",
        "source_filename": "Chitta_Extract_2011.png",
        "mime_type": "image/png",
        "size_bytes": 1102448,
        "document_type": "Chitta",
        "sync_status": "Validated",
        "owner_name": "M. Lakshmi",
        "survey_no": "12/1",
        "village": "Nallur",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
    },
    {
        "external_gov_id": "seed-mutation",
        "source_filename": "Mutation_Khata_88.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 890112,
        "document_type": "Mutation",
        "sync_status": "Needs Verification",
        "owner_name": "P. Selvam",
        "survey_no": "88/2",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
    },
    {
        "external_gov_id": "seed-deed",
        "source_filename": "SaleDeed_Registration_2009.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 4612096,
        "document_type": "Sale Deed",
        "sync_status": "Conflict Detected",
        "owner_name": "K. Meenakshi",
        "survey_no": "142/3-B",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
    },
    {
        "external_gov_id": "seed-areg",
        "source_filename": "A-Register_Sirkazhi_1984.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 6230016,
        "document_type": "A-Register",
        "sync_status": "Approved",
        "owner_name": "R. Venkatesan",
        "survey_no": "142/3",
        "village": "Sirkazhi",
        "district": "Mayiladuthurai",
        "taluk": "Sirkazhi",
    }
]

def seed():
    init_db()  # Ensure tables are built
    db = SessionLocal()
    try:
        # Check if database already has records. If not empty, do not wipe user uploads!
        existing_count = db.query(LandRecordDB).count()
        if existing_count > 0:
            print(f"[seeder] Database already contains {existing_count} records. Preserving existing data.")
            return

        print("[seeder] Database is empty. Seeding initial master records and document queue...")

        # 2. Insert Master Parcels
        for p in MASTER_PARCELS_DATA:
            record = LandRecordDB(
                external_gov_id=p["external_gov_id"],
                owner_name=p["owner_name"],
                owner_father_or_son_name=p["owner_father_or_son_name"],
                survey_no=p["survey_no"],
                land_area_acres=p["land_area_acres"],
                village=p["village"],
                district=p["district"],
                taluk=p["taluk"],
                document_type=p["document_type"],
                land_type=p["land_type"],
                sync_status=p["sync_status"],
                ocr_metadata=p["ocr_metadata"],
                parsed_fields_json={
                    "document_type": p["document_type"],
                    "patta_no": p["external_gov_id"].split("-")[-1],
                    "survey_no": p["survey_no"],
                    "owner_name": p["owner_name"],
                    "owner_father_or_son_name": p["owner_father_or_son_name"],
                    "district": p["district"],
                    "taluk": p["taluk"],
                    "village": p["village"],
                    "land_type": p["land_type"],
                    "land_area_acres": p["land_area_acres"].split(" ")[0]
                }
            )
            # Add mock GIS coordinates to geometry column if possible
            if "map_shape" in p["ocr_metadata"]:
                pts = p["ocr_metadata"]["map_shape"]["points"].split(" ")
                coords = []
                for pt in pts:
                    xy = pt.split(",")
                    # Convert schematic points (0-900 grid) into arbitrary mock longitude/latitude
                    # to keep it georeferenced for standard DB parsers
                    lon = 79.79 + float(xy[0]) * 0.0001
                    lat = 11.14 + float(xy[1]) * 0.0001
                    coords.append([lon, lat])
                if coords:
                    coords.append(coords[0]) # close polygon loop
                    record.geojson_geometry = {
                        "type": "Polygon",
                        "coordinates": [coords]
                    }
                    record.longitude = coords[0][0]
                    record.latitude = coords[0][1]

            db.add(record)

        # 3. Insert Ingestion Queue Documents
        for d in SEED_DOCUMENTS_DATA:
            # Recreate structured record mock content based on name/format
            metadata = d.get("ocr_metadata", {})
            metadata["mimeType"] = d["mime_type"]
            metadata["sizeBytes"] = d["size_bytes"]

            record = LandRecordDB(
                external_gov_id=d["external_gov_id"],
                source_filename=d["source_filename"],
                document_type=d["document_type"],
                sync_status=d["sync_status"],
                owner_name=d["owner_name"],
                survey_no=d["survey_no"],
                village=d["village"],
                district=d["district"],
                taluk=d["taluk"],
                image_url=f"/uploads/{d['source_filename']}",
                ocr_metadata=metadata,
                parsed_fields_json={
                    "document_type": d["document_type"],
                    "survey_no": d["survey_no"],
                    "owner_name": d["owner_name"],
                    "village": d["village"],
                    "district": d["district"],
                    "taluk": d["taluk"]
                }
            )
            db.add(record)

        db.commit()
        print(f"[seeder] Successfully seeded {len(MASTER_PARCELS_DATA)} master records and {len(SEED_DOCUMENTS_DATA)} document queue items.")
    except Exception as e:
        db.rollback()
        print(f"[seeder] ERROR: Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
