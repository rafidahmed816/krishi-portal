---
description: How to make a git commit for the AgroLink project
---

# Git Commit Workflow

// turbo-all

## Step 1: Stage Changes
```bash
cd /home/muntasir/project/agrolink && git add -A
```

## Step 2: Check Status
```bash
cd /home/muntasir/project/agrolink && git status
```

## Step 3: Commit
Use conventional commit format:
- `feat: description` — new feature
- `fix: description` — bug fix
- `docs: description` — documentation
- `chore: description` — maintenance
- `refactor: description` — code restructuring
- `style: description` — formatting
- `test: description` — tests

```bash
cd /home/muntasir/project/agrolink && git commit -m "type: descriptive message"
```

## Step 4: Update Task Tracking
After committing, update `.agent/CURRENT_TASK.md` with what was completed.
