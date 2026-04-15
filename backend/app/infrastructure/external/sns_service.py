"""AWS SNS notification service — send email alerts for crop reminders and order updates."""

from __future__ import annotations

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

_sns_client = None
_topic_arn = None


def _get_sns():
    global _sns_client
    if _sns_client is None:
        _sns_client = boto3.client(
            "sns",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            aws_session_token=settings.AWS_SESSION_TOKEN,
        )
    return _sns_client


def _get_topic_arn() -> str:
    """Get or create the AgroLink SNS topic."""
    global _topic_arn
    if _topic_arn:
        return _topic_arn
    sns = _get_sns()
    try:
        resp = sns.create_topic(Name="AgroLink-Notifications")
        _topic_arn = resp["TopicArn"]
        return _topic_arn
    except ClientError as e:
        print(f"SNS create_topic error: {e}")
        raise


def subscribe_email(email: str) -> str | None:
    """Subscribe an email to AgroLink notifications. Returns subscription ARN or None."""
    sns = _get_sns()
    topic_arn = _get_topic_arn()
    try:
        resp = sns.subscribe(
            TopicArn=topic_arn,
            Protocol="email",
            Endpoint=email,
            ReturnSubscriptionArn=True,
        )
        return resp.get("SubscriptionArn")
    except ClientError as e:
        print(f"SNS subscribe error: {e}")
        return None


def send_notification(subject: str, message: str, email: str | None = None) -> bool:
    """Send a notification. If email is provided, send directly; otherwise broadcast to topic."""
    sns = _get_sns()
    try:
        if email:
            # Direct email via SNS publish to a specific endpoint
            topic_arn = _get_topic_arn()
            sns.publish(
                TopicArn=topic_arn,
                Subject=subject[:100],  # SNS subject max 100 chars
                Message=message,
                MessageAttributes={
                    "email": {
                        "DataType": "String",
                        "StringValue": email,
                    }
                },
            )
        else:
            topic_arn = _get_topic_arn()
            sns.publish(
                TopicArn=topic_arn,
                Subject=subject[:100],
                Message=message,
            )
        return True
    except ClientError as e:
        print(f"SNS publish error: {e}")
        return False


def send_email_direct(email: str, subject: str, message: str) -> bool:
    """Send a direct email notification using SNS. Requires email to be subscribed."""
    return send_notification(subject, message, email)


# ── Convenience functions ───────────────────────────────────────────

def notify_order_placed(seller_email: str, buyer_name: str, product_title: str, quantity: int, total: float):
    """Notify seller when a new order is placed."""
    subject = f"🛒 New Order: {product_title}"
    message = (
        f"Hello,\n\n"
        f"Great news! You have a new order on AgroLink.\n\n"
        f"📦 Product: {product_title}\n"
        f"👤 Buyer: {buyer_name}\n"
        f"📊 Quantity: {quantity}\n"
        f"💰 Total: ৳{total:,.2f}\n\n"
        f"Please log in to AgroLink to confirm the order.\n\n"
        f"— AgroLink Team"
    )
    return send_notification(subject, message, seller_email)


def notify_order_status(buyer_email: str, product_title: str, new_status: str):
    """Notify buyer when order status changes."""
    subject = f"📋 Order Update: {product_title}"
    emoji_map = {"confirmed": "✅", "shipped": "🚚", "delivered": "📦", "cancelled": "❌"}
    emoji = emoji_map.get(new_status, "📋")
    message = (
        f"Hello,\n\n"
        f"Your order status has been updated on AgroLink.\n\n"
        f"📦 Product: {product_title}\n"
        f"{emoji} New Status: {new_status.upper()}\n\n"
        f"Log in to AgroLink to view details.\n\n"
        f"— AgroLink Team"
    )
    return send_notification(subject, message, buyer_email)


def notify_crop_reminder(farmer_email: str, crop_name: str, farm_name: str, reminder_message: str):
    """Send a crop reminder notification to a farmer."""
    subject = f"🌾 Crop Reminder: {crop_name}"
    message = (
        f"Hello,\n\n"
        f"This is a reminder for your crop on AgroLink.\n\n"
        f"🏡 Farm: {farm_name}\n"
        f"🌱 Crop: {crop_name}\n"
        f"📝 Reminder: {reminder_message}\n\n"
        f"— AgroLink Team"
    )
    return send_notification(subject, message, farmer_email)
