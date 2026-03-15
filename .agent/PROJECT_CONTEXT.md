# AgroLink — Project Context

> Read this first if you're an AI agent picking up this project.

## Overview
AgroLink — AI-driven agricultural marketplace. See `srs.pdf` for full requirements.

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Python FastAPI (Clean Architecture) |
| Auth | **AWS Cognito** |
| Database | PostgreSQL (AWS RDS) |
| Storage | AWS S3 |
| Compute | AWS EC2, Lambda |
| AI | OpenAI / Anthropic / Gemini APIs |
| ML | scikit-learn, pandas |

## Structure
```
agrolink/
├── frontend/                  # Next.js 14 (created via create-next-app)
├── backend/                   # FastAPI Clean Architecture
│   ├── app/
│   │   ├── domain/            # Entities, repository interfaces
│   │   ├── application/       # Use cases, DTOs
│   │   ├── infrastructure/    # DB, Cognito, S3, AI, ML
│   │   └── presentation/     # API routes
│   ├── tests/
│   ├── requirements.txt       # pip freeze output
│   └── venv/                  # Python virtual env (gitignored)
├── lambda/                    # AWS Lambda functions
├── infra/sql/                 # Database schema
├── ml/                        # ML training scripts/datasets
├── .agent/                    # Agent handoff system
└── .env.example               # Environment template
```

## Approach: Step by step
- Build one feature at a time
- Commit after each feature
- AWS Learner Lab for cloud services

## Commands
```bash
# Frontend dev
cd frontend && npm run dev

# Backend dev
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000
```
