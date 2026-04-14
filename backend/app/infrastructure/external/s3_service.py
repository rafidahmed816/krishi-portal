"""AWS S3 service for product image uploads."""

from __future__ import annotations

import uuid
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

settings = get_settings()

BUCKET_NAME = "agrolink-product-images"

_s3_client = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    aws_session_token=settings.AWS_SESSION_TOKEN or None,
)


def ensure_bucket_exists() -> None:
    """Create the S3 bucket if it doesn't exist."""
    try:
        _s3_client.head_bucket(Bucket=BUCKET_NAME)
    except ClientError:
        try:
            if settings.AWS_REGION == "us-east-1":
                _s3_client.create_bucket(Bucket=BUCKET_NAME)
            else:
                _s3_client.create_bucket(
                    Bucket=BUCKET_NAME,
                    CreateBucketConfiguration={"LocationConstraint": settings.AWS_REGION},
                )
            # Make images publicly readable
            _s3_client.delete_public_access_block(Bucket=BUCKET_NAME)
            _s3_client.put_bucket_policy(
                Bucket=BUCKET_NAME,
                Policy="""{
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": "arn:aws:s3:::%s/*"
                    }]
                }""" % BUCKET_NAME,
            )
        except ClientError as e:
            print(f"Warning: Could not create/configure S3 bucket: {e}")


def upload_image(file: UploadFile) -> str:
    """Upload an image to S3 and return the public URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed",
        )

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    key = f"products/{uuid.uuid4()}.{ext}"

    try:
        _s3_client.upload_fileobj(
            file.file,
            BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": file.content_type},
        )
        return f"https://{BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}",
        )
