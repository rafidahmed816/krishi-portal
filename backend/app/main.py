"""AgroLink — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.presentation.routes.auth_routes import router as auth_router
from app.presentation.routes.product_routes import router as product_router

settings = get_settings()

app = FastAPI(
    title="AgroLink API",
    description="Agricultural marketplace connecting farmers, buyers, and admins.",
    version="0.2.0",
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


# ── Health check ────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Return service health status."""
    return {"status": "healthy", "service": "agrolink-api"}
