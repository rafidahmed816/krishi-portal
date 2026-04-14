"""Dashboard stats — aggregate data from DynamoDB for dashboard display."""

from __future__ import annotations

from app.infrastructure.database import product_repo


def get_farmer_stats(farmer_email: str) -> dict:
    """Get stats for a specific farmer."""
    products = product_repo.list_products_by_farmer(farmer_email)
    total_products = len(products)
    total_quantity = sum(p.get("quantity", 0) for p in products)
    total_value = sum(p.get("price", 0) * p.get("quantity", 0) for p in products)
    categories = len(set(p.get("category", "") for p in products))
    return {
        "total_products": total_products,
        "total_value": round(total_value, 2),
        "total_quantity": total_quantity,
        "categories": categories,
    }


def get_buyer_stats() -> dict:
    """Get stats for a buyer (marketplace overview)."""
    products = product_repo.list_products()
    total_products = len(products)
    total_farmers = len(set(p.get("farmer_email", "") for p in products))
    categories = len(set(p.get("category", "") for p in products))
    avg_price = round(sum(p.get("price", 0) for p in products) / max(total_products, 1), 2)
    return {
        "total_products": total_products,
        "total_farmers": total_farmers,
        "categories": categories,
        "avg_price": avg_price,
    }


def get_admin_stats() -> dict:
    """Get stats for an admin (platform overview)."""
    products = product_repo.list_products()
    total_products = len(products)
    total_farmers = len(set(p.get("farmer_email", "") for p in products))
    categories = len(set(p.get("category", "") for p in products))
    total_inventory_value = round(sum(p.get("price", 0) * p.get("quantity", 0) for p in products), 2)
    return {
        "total_products": total_products,
        "total_farmers": total_farmers,
        "categories": categories,
        "total_inventory_value": total_inventory_value,
    }
