---
description: How to resume work on AgroLink when switching to a new AI model/agent
---

# Agent Handoff Workflow

When you are a new AI agent picking up work on this project, follow these steps:

## Step 1: Read Project Context
Read the project context file to understand the full project:
```
.agent/PROJECT_CONTEXT.md
```

## Step 2: Read Current Task State
Read the current task state to know exactly where work left off:
```
.agent/CURRENT_TASK.md
```

## Step 3: Check Git Log
Run this to see what has been committed so far:
```bash
git log --oneline -20
```

## Step 4: Check What Phase We Are In
The project follows 6 phases. Check `CURRENT_TASK.md` to see which phase is active.

## Step 5: Pick Up The Next Task
Look at the "What Needs To Be Done Next" section in `CURRENT_TASK.md` and start working on the first uncompleted item.

## Step 6: After Completing Work
**CRITICAL**: Before ending your session, update these files:
1. Update `.agent/CURRENT_TASK.md` with:
   - What you completed
   - What needs to be done next
   - Any blockers or decisions made
2. Commit your changes with a descriptive message

## Tips For Effective Handoff
- Make small, focused commits (one per feature/component)
- Use conventional commit messages: `feat:`, `fix:`, `docs:`, `chore:`
- Always update CURRENT_TASK.md before stopping
- Don't leave half-finished features — complete a logical unit before stopping
