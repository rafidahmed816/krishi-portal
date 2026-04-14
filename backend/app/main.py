"""AgroLink — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.presentation.routes.auth_routes import router as auth_router
from app.presentation.routes.product_routes import router as product_router
from app.presentation.routes.upload_routes import router as upload_router
from app.presentation.routes.dashboard_routes import router as dashboard_router

settings = get_settings()

app = FastAPI(
    title="AgroLink API",
    description="Agricultural marketplace connecting farmers, buyers, and admins.",
    version="0.3.0",
)

# ── CORS ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(upload_router)
app.include_router(dashboard_router)


# ── Startup ─────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Initialize S3 bucket on startup."""
    try:
        from app.infrastructure.external.s3_service import ensure_bucket_exists
        ensure_bucket_exists()
    except Exception as e:
        print(f"S3 bucket init warning (non-fatal): {e}")


# ── Health check ────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Return service health status."""
    return {"status": "healthy", "service": "agrolink-api", "version": "0.3.0"}
