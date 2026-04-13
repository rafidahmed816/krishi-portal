"""AWS Cognito service — wraps boto3 calls for sign-up / sign-in / confirm."""

from __future__ import annotations

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status

from app.core.config import get_settings

settings = get_settings()


def _cognito_client():
    """Return a boto3 Cognito Identity Provider client."""
    kwargs = {
        "service_name": "cognito-idp",
        "region_name": settings.AWS_REGION,
    }
    # Use explicit credentials when provided (Learner Lab)
    if settings.AWS_ACCESS_KEY_ID:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    if settings.AWS_SESSION_TOKEN:
        kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN
    return boto3.client(**kwargs)


# ── Sign-up ─────────────────────────────────────────────────────────
def sign_up(
    email: str,
    password: str,
    full_name: str,
    user_type: str,
    extra_attributes: dict | None = None,
) -> dict:
    """Register a new user in Cognito with a custom user_type attribute."""
    client = _cognito_client()
    attributes = [
        {"Name": "email", "Value": email},
        {"Name": "name", "Value": full_name},
        {"Name": "custom:user_type", "Value": user_type},
    ]
    if extra_attributes:
        for key, value in extra_attributes.items():
            attributes.append({"Name": f"custom:{key}", "Value": value})

    try:
        response = client.sign_up(
            ClientId=settings.COGNITO_APP_CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=attributes,
        )
        return {
            "user_sub": response["UserSub"],
            "confirmed": response["UserConfirmed"],
        }
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        msg = exc.response["Error"]["Message"]
        if code == "UsernameExistsException":
            raise HTTPException(status.HTTP_409_CONFLICT, detail=msg)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=msg)


# ── Confirm sign-up ─────────────────────────────────────────────────
def confirm_sign_up(email: str, confirmation_code: str) -> dict:
    """Confirm a user's email with the verification code."""
    client = _cognito_client()
    try:
        client.confirm_sign_up(
            ClientId=settings.COGNITO_APP_CLIENT_ID,
            Username=email,
            ConfirmationCode=confirmation_code,
        )
        return {"confirmed": True}
    except ClientError as exc:
        msg = exc.response["Error"]["Message"]
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=msg)


# ── Sign-in ─────────────────────────────────────────────────────────
def sign_in(email: str, password: str) -> dict:
    """Authenticate and return Cognito tokens."""
    client = _cognito_client()
    try:
        response = client.initiate_auth(
            ClientId=settings.COGNITO_APP_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": email,
                "PASSWORD": password,
            },
        )
        auth_result = response["AuthenticationResult"]
        return {
            "access_token": auth_result["AccessToken"],
            "id_token": auth_result["IdToken"],
            "refresh_token": auth_result.get("RefreshToken", ""),
            "expires_in": auth_result["ExpiresIn"],
            "token_type": auth_result["TokenType"],
        }
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        msg = exc.response["Error"]["Message"]
        if code == "NotAuthorizedException":
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=msg)
        if code == "UserNotConfirmedException":
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail="Please confirm your email address first.",
            )
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=msg)


# ── Get current user ────────────────────────────────────────────────
def get_user(access_token: str) -> dict:
    """Fetch the authenticated user's profile from Cognito."""
    client = _cognito_client()
    try:
        response = client.get_user(AccessToken=access_token)
        attrs = {a["Name"]: a["Value"] for a in response["UserAttributes"]}
        return {
            "username": response["Username"],
            "email": attrs.get("email", ""),
            "name": attrs.get("name", ""),
            "user_type": attrs.get("custom:user_type", ""),
            "email_verified": attrs.get("email_verified", "false"),
            "sub": attrs.get("sub", ""),
        }
    except ClientError as exc:
        msg = exc.response["Error"]["Message"]
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=msg)


# ── Add user to group ───────────────────────────────────────────────
def add_user_to_group(email: str, group_name: str) -> None:
    """Add a confirmed user to a Cognito group (farmers/buyers/admins)."""
    client = _cognito_client()
    try:
        client.admin_add_user_to_group(
            UserPoolId=settings.COGNITO_USER_POOL_ID,
            Username=email,
            GroupName=group_name,
        )
    except ClientError as exc:
        msg = exc.response["Error"]["Message"]
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=msg)
