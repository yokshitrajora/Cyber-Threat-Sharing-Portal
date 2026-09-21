import re
from typing import Tuple, List
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

SENSITIVE_PARAM_KEYS = {
    "token", "auth", "key", "user", "pass", "password", "email", "session",
    "sig", "secret", "id", "access_token", "jwt", "api_key", "bearer", "apikey",
    "credential", "pwd", "auth_token", "refresh_token"
}

# Regex patterns for unstructured PII in descriptions and payloads
CREDIT_CARD_REGEX = re.compile(r"\b(?:\d{4}[ -]?){3}\d{4}\b")
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
BEARER_TOKEN_REGEX = re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE)

PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")

class PIIScrubber:
    """
    Server-side PII Scrubbing and Parameter Sanitization Engine.
    Strips authorization tokens, session keys, emails, card numbers, and credentials
    from both raw indicator strings and freeform incident descriptions.
    """

    @classmethod
    def scrub_indicator(cls, indicator_str: str) -> Tuple[str, List[str]]:
        """
        Strips query parameter tracking tokens from URL strings.
        Returns: (sanitized_indicator, list_of_stripped_params)
        """
        if not indicator_str or not isinstance(indicator_str, str):
            return "", []

        cleaned = indicator_str.strip()
        stripped_params = []

        # Check if input resembles a URL
        if "://" in cleaned or cleaned.startswith("www.") or "?" in cleaned:
            target = cleaned if "://" in cleaned else f"http://{cleaned}"
            try:
                parsed = urlparse(target)
                if parsed.query:
                    query_dict = parse_qs(parsed.query, keep_blank_values=True)
                    clean_dict = {}
                    
                    for key, values in query_dict.items():
                        key_lower = key.lower()
                        if key_lower in SENSITIVE_PARAM_KEYS or any(s in key_lower for s in ("token", "session", "auth", "secret")):
                            for val in values:
                                stripped_params.append(f"{key}={val}")
                        else:
                            clean_dict[key] = values

                    # Reconstruct URL query string
                    new_query = urlencode(clean_dict, doseq=True)
                    new_url = urlunparse((
                        parsed.scheme,
                        parsed.netloc,
                        parsed.path,
                        parsed.params,
                        new_query,
                        parsed.fragment
                    ))
                    
                    # If original didn't have scheme, preserve that
                    if "://" not in cleaned:
                        new_url = re.sub(r"^https?://", "", new_url)
                    
                    return new_url.rstrip("?"), stripped_params
            except Exception:
                pass

        # Fallback simple split on '?'
        if "?" in cleaned:
            base, query = cleaned.split("?", 1)
            return base, [query]

        return cleaned, []

    @classmethod
    def scrub_text(cls, text: str) -> str:
        """
        Masks unstructured PII (credit cards, SSNs, bearer tokens, emails, phone numbers) from text descriptions.
        """
        if not text:
            return ""

        scrubbed = BEARER_TOKEN_REGEX.sub("Bearer [REDACTED_TOKEN]", text)
        scrubbed = CREDIT_CARD_REGEX.sub("[REDACTED_CREDIT_CARD]", scrubbed)
        scrubbed = SSN_REGEX.sub("[REDACTED_SSN]", scrubbed)
        scrubbed = EMAIL_REGEX.sub("[REDACTED_EMAIL]", scrubbed)
        scrubbed = PHONE_REGEX.sub("[REDACTED_PHONE]", scrubbed)
        return scrubbed

def contains_pii(text: str) -> bool:
    """Detects whether text contains potentially sensitive PII patterns."""
    if not text:
        return False
    return bool(
        EMAIL_REGEX.search(text) or
        CREDIT_CARD_REGEX.search(text) or
        SSN_REGEX.search(text) or
        PHONE_REGEX.search(text) or
        BEARER_TOKEN_REGEX.search(text)
    )

def scrub_pii(text: str) -> str:
    """Convenience alias for PIIScrubber.scrub_text."""
    return PIIScrubber.scrub_text(text)

def scrub_payload(indicator: str, description: str = "") -> Tuple[str, str, List[str]]:
    """Convenience helper to scrub both indicator and description."""
    clean_indicator, stripped = PIIScrubber.scrub_indicator(indicator)
    clean_desc = PIIScrubber.scrub_text(description) if description else ""
    return clean_indicator, clean_desc, stripped

