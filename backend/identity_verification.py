"""
TerraLens Identity & Lineage Verification Service
=================================================
Secures land transactions against the "Pre-2018 Loophole" by cross-referencing
extracted owner names against a mock Civil Death Registry and Identity Gateway.
If an owner is flagged as deceased prior to the document execution, a Legal Heir
Certificate is strictly mandated.
"""

from __future__ import annotations
import hashlib
from typing import Optional

# Mock Civil Death Registry Database (In a real scenario, this is a Govt API like Jeevan Pramaan)
MOCK_DEATH_REGISTRY = {
    # Keys are normalized (lowercase, spaces stripped) for matching
    "r.ramasamy": {"status": "DECEASED", "year_of_death": 2016},
    "s.gopal": {"status": "DECEASED", "year_of_death": 2010},
    "k.murugan": {"status": "ALIVE"},
}

def normalize_name(name: str) -> str:
    """Normalizes name for basic matching (lowercase, remove spaces)."""
    if not name:
        return ""
    return name.lower().replace(" ", "")

def verify_life_state(owner_name: Optional[str]) -> dict:
    """
    Cross-references the owner's name against the Death Registry.
    Returns a dictionary detailing life state and required actions.
    """
    if not owner_name:
        return {
            "status": "UNVERIFIED",
            "message": "No owner name extracted to verify.",
            "requires_legal_heir_certificate": False
        }

    normalized = normalize_name(owner_name)
    
    # Simple substring matching for the mock registry
    matched_record = None
    for key, record in MOCK_DEATH_REGISTRY.items():
        if key in normalized or normalized in key:
            matched_record = record
            break
            
    if matched_record:
        if matched_record["status"] == "DECEASED":
            return {
                "status": "DECEASED_OWNER_FLAG",
                "message": f"CRITICAL: Owner flagged as deceased (Recorded: {matched_record['year_of_death']}). Suspected Forgery.",
                "requires_legal_heir_certificate": True,
                "severity": "HIGH_RISK"
            }
        else:
            return {
                "status": "ALIVE",
                "message": "Owner verified in Life State Registry.",
                "requires_legal_heir_certificate": False,
                "severity": "LOW_RISK"
            }
            
    # If not found in registry, default to manual verification required
    return {
        "status": "NOT_FOUND_IN_REGISTRY",
        "message": "Owner not found in digital registry. Manual verification required.",
        "requires_legal_heir_certificate": False,
        "severity": "MEDIUM_RISK"
    }

def hash_identity_document(id_number: str) -> str:
    """
    Zero-Knowledge Principle: Never store plain-text Aadhaar or PAN.
    Uses SHA-256 (in production, use Argon2 or bcrypt with a strong salt).
    """
    salt = "TERRALENS_SECURE_SALT_2026"
    return hashlib.sha256((id_number + salt).encode('utf-8')).hexdigest()

def verify_identity_hash(id_hash: str) -> bool:
    """
    Mock function representing sending the hash to UIDAI/NSDL gateway.
    Returns True if the identity is valid and not blacklisted.
    """
    # In a real system, this would make an external API call.
    return True
