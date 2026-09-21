import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

try:
    import stix2
    HAS_STIX2 = True
except ImportError:
    HAS_STIX2 = False

def get_stix_pattern(indicator_type: str, indicator_value: str) -> str:
    """Generates standard STIX 2.1 comparison pattern."""
    clean_val = indicator_value.replace("'", "\\'")
    if indicator_type == "URL":
        return f"[url:value = '{clean_val}']"
    elif indicator_type == "IP":
        return f"[ipv4-addr:value = '{clean_val}']"
    elif indicator_type == "Email":
        return f"[email-addr:value = '{clean_val}']"
    elif indicator_type == "Domain":
        return f"[domain-name:value = '{clean_val}']"
    return f"[artifact:payload_bin = '{clean_val}']"

def build_stix2_bundle(
    indicator_value: str,
    indicator_type: str,
    score: int,
    severity: str,
    description: Optional[str] = None,
    threat_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Constructs a valid STIX 2.1 JSON Bundle containing an Indicator SDO.
    Uses OASIS STIX 2.1 specification.
    """
    pattern = get_stix_pattern(indicator_type, indicator_value)
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    indicator_id = f"indicator--{uuid.uuid4()}"
    bundle_id = f"bundle--{uuid.uuid4()}"

    if HAS_STIX2:
        try:
            indicator_sdo = stix2.Indicator(
                id=indicator_id,
                created=now_iso,
                modified=now_iso,
                name=f"Threat Indicator: {indicator_value}",
                description=description or f"Identified {indicator_type} with risk score {score}/100 ({severity})",
                pattern=pattern,
                pattern_type="stix",
                valid_from=now_iso,
                confidence=score,
                indicator_types=["malicious-activity"]
            )
            bundle = stix2.Bundle(
                id=bundle_id,
                objects=[indicator_sdo]
            )
            return json.loads(bundle.serialize())
        except Exception:
            pass

    # Pure Python OASIS STIX 2.1 compliant fallback structure
    return {
        "type": "bundle",
        "id": bundle_id,
        "spec_version": "2.1",
        "objects": [
            {
                "type": "indicator",
                "spec_version": "2.1",
                "id": indicator_id,
                "created": now_iso,
                "modified": now_iso,
                "name": f"Threat Indicator: {indicator_value}",
                "description": description or f"Identified {indicator_type} with risk score {score}/100 ({severity})",
                "indicator_types": ["malicious-activity"],
                "pattern": pattern,
                "pattern_type": "stix",
                "pattern_version": "2.1",
                "valid_from": now_iso,
                "confidence": score,
                "external_references": [
                    {
                        "source_name": "Shield AI SOC Core",
                        "external_id": threat_id or "SHIELD-INC"
                    }
                ]
            }
        ]
    }

def create_stix_bundle(
    indicator: str,
    threat_type: str = "URL",
    description: Optional[str] = None,
    confidence: int = 75,
    severity: str = "High",
    labels: Optional[list] = None
) -> Dict[str, Any]:
    """Helper wrapper for STIX 2.1 bundle creation."""
    return build_stix2_bundle(
        indicator_value=indicator,
        indicator_type=threat_type,
        score=confidence,
        severity=severity,
        description=description
    )

