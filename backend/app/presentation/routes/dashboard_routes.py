"""Dashboard API routes — dynamic stats and data."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from app.application.use_cases import auth_use_cases
from app.application.use_cases import dashboard_use_cases

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _get_user_info(authorization: str) -> dict:
    """Extract user profile from JWT token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ").strip()
    return auth_use_cases.get_profile(token)


@router.get("/stats")
async def get_dashboard_stats(
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Get role-based dashboard statistics."""
    user = _get_user_info(authorization)
    role = user.get("user_type", "buyer")

    if role == "farmer":
        stats = dashboard_use_cases.get_farmer_stats(user["email"])
        return {
            "role": "farmer",
            "stats": [
                {"icon": "📦", "label": "Products Listed", "value": str(stats["total_products"]), "color": "rgba(22, 163, 74, 0.12)"},
                {"icon": "💰", "label": "Inventory Value", "value": f"৳{stats['total_value']:,.0f}", "color": "rgba(245, 158, 11, 0.12)"},
                {"icon": "📊", "label": "Total Stock", "value": f"{stats['total_quantity']:,}", "color": "rgba(14, 165, 233, 0.12)"},
                {"icon": "🏷️", "label": "Categories", "value": str(stats["categories"]), "color": "rgba(168, 85, 247, 0.12)"},
            ],
        }
    elif role == "admin":
        stats = dashboard_use_cases.get_admin_stats()
        return {
            "role": "admin",
            "stats": [
                {"icon": "👥", "label": "Active Farmers", "value": str(stats["total_farmers"]), "color": "rgba(14, 165, 233, 0.12)"},
                {"icon": "🏪", "label": "Total Products", "value": str(stats["total_products"]), "color": "rgba(22, 163, 74, 0.12)"},
                {"icon": "📊", "label": "Inventory Value", "value": f"৳{stats['total_inventory_value']:,.0f}", "color": "rgba(245, 158, 11, 0.12)"},
                {"icon": "🏷️", "label": "Categories", "value": str(stats["categories"]), "color": "rgba(239, 68, 68, 0.12)"},
            ],
        }
    else:
        stats = dashboard_use_cases.get_buyer_stats()
        return {
            "role": "buyer",
            "stats": [
                {"icon": "🛒", "label": "Products Available", "value": str(stats["total_products"]), "color": "rgba(14, 165, 233, 0.12)"},
                {"icon": "👨‍🌾", "label": "Active Farmers", "value": str(stats["total_farmers"]), "color": "rgba(22, 163, 74, 0.12)"},
                {"icon": "🏷️", "label": "Categories", "value": str(stats["categories"]), "color": "rgba(245, 158, 11, 0.12)"},
                {"icon": "💵", "label": "Avg. Price", "value": f"৳{stats['avg_price']:,.0f}", "color": "rgba(236, 72, 153, 0.12)"},
            ],
        }
