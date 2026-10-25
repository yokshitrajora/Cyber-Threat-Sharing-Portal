from typing import Optional, Dict, Any
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Optional[str] = "standard"
    username: Optional[str] = None
    user: Optional[Dict[str, Any]] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = "standard"
    exp: Optional[int] = None
