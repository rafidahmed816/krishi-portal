"""Upload routes for file handling (S3)."""

from __future__ import annotations

from fastapi import APIRouter, File, Header, HTTPException, UploadFile, status

from app.infrastructure.external import s3_service

router = APIRouter(prefix="/api/upload", tags=["Upload"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(..., description="Image file to upload"),
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Upload a product image to S3. Returns the public URL."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required",
        )
    url = s3_service.upload_image(file)
    return {"image_url": url}
