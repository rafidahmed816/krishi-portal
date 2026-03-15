---
description: How to run the AgroLink development servers locally
---

# Dev Server Workflow

// turbo-all

## Step 1: Start Backend
```bash
cd /home/muntasir/project/agrolink/backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

## Step 2: Start Frontend (in a new terminal)
```bash
cd /home/muntasir/project/agrolink/frontend && npm run dev
```

## Step 3: Verify
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
