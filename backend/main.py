import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.threats import router as threats_router
from app.api.v1.analytics import router as analytics_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("shield-api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SOC database...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down SHIELD SOC backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    description="Enterprise Cybersecurity Threat Intelligence & SOC Dashboard API"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:80",
    "http://localhost"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(threats_router, prefix=f"{settings.API_V1_STR}/threats", tags=["Threat Intelligence"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["SOC Analytics"])

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
