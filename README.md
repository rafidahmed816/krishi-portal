# 🌾 AgroLink

**AI-Driven Agricultural Marketplace & Intelligence Portal**

AgroLink is a cloud-native agricultural platform connecting farmers and buyers through a digital marketplace while providing ML-driven insights for yield prediction, price estimation, and pest management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (TypeScript, Tailwind CSS v4) |
| **Backend** | Python FastAPI (Clean Architecture) |
| **Auth** | AWS Cognito |
| **Database** | AWS DynamoDB |
| **Storage** | AWS S3 |
| **Cloud** | AWS EC2, Lambda, CloudWatch |

## Features

- 🔐 **User Management** — Multi-role (Farmer/Buyer), Cognito auth, JWT
- 🏡 **Farm Management** — Create/manage farms, S3 image upload, soil type tracking
- 🌾 **Crop Lifecycle** — Growth stages (Seedling→Harvested), health monitoring, progress tracking
- 📦 **Inventory Tracking** — Seeds/fertilizers/pesticides, low-stock alerts, quantity adjustment
- 🛒 **Marketplace** — List products, browse with filters, product detail pages
- 📋 **Order System** — Place orders, status workflow, stock validation
- 🌗 **Dark/Light Theme** — Toggle with persistent preference

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

## Environment Variables

Create a `.env` file in the project root with your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
COGNITO_USER_POOL_ID=your_pool_id
COGNITO_CLIENT_ID=your_client_id
S3_BUCKET_NAME=agrolink-product-images
```

## DynamoDB Tables

| Table | Purpose | Auto-Create |
|-------|---------|-------------|
| `agrolink-products` | Marketplace products | ✅ |
| `agrolink-orders` | Order management | ✅ |
| `agrolink-farms` | Farm management | ✅ |
| `agrolink-crops` | Crop lifecycle | ✅ |
| `agrolink-inventory` | Inventory tracking | ✅ |
