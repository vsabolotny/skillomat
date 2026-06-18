---
name: kb
description: "Update the documentation/kb/ knowledge base after a PR merge. Regenerates ARCHITECTURE.md from code, patches FEATURES.md with new/changed features, and commits to main. Invoke as /kb after merging a PR."
argument-hint: "[pr-number|full]"
---

# /kb — Knowledge Base Updater

Keeps `documentation/kb/` in sync with the codebase after each PR merge. Run after every significant merge.

`$ARGUMENTS`:
- *(empty)* — auto-detect last merged PR from `git log`
- `<number>` — use PR #N as the source of changes
- `full` — regenerate all four KB files from scratch (use when KB is known stale)

---

## When to run

- **After every PR merge** (Step 9 of the push pipeline).
- **After a batch of changes** that were pushed outside the push pipeline.
- **`full` mode**: when the KB is known stale (new migrations, large refactor, or KB hasn't been updated in >3 PRs).

## When NOT to run

- After docs-only merges (changes only under `docs/**` or `documentation/**`).
- After `.claude/**`-only changes (skill/settings changes don't affect product code).
- After this skill itself runs (avoid commit loops).

---

## Step 1 — Identify changed files

```bash
# If PR number given, inspect that PR's files:
gh pr view <pr-number> --json files --jq '.files[].path' 2>/dev/null

# Otherwise, diff since last KB update commit:
git log --oneline --format="%H %s" | grep -v "^.*docs(kb)" | head -1
# Then: git diff <that-sha>..HEAD --name-only
```

Classify changes into buckets:
- `MODELS` — any `backend/app/Models/*.php` changed
- `ROUTES` — any `backend/routes/*.php` changed
- `FRONTEND` — any `web/src/components/**/*.tsx` or `web/src/pages/**/*.tsx` changed
- `SERVICES` — any `backend/app/Services/*.php` or `backend/app/Http/Controllers/*.php` changed
- `FEATURE` — any new card/page/service or a PR with `feat(...)` commit prefix
- `OPS` — any `.github/workflows/*.yml` or `deploy/*.sh` or `backend/config/*.php` changed
- `DECISION` — PR description or commit message explicitly calls out an architectural decision

If no files match any bucket (pure docs/config change): **print one line and exit** — "No code changes detected; KB is current."

---

## Step 2 — Regenerate ARCHITECTURE.md (if MODELS, ROUTES, FRONTEND, or SERVICES)

Run the code-extraction scripts and replace the relevant sections in `documentation/kb/ARCHITECTURE.md`.

**Schema snapshot** (run if MODELS bucket triggered):
```bash
# Use Laravel's built-in model:show for each Eloquent model (run from backend/).
cd backend
for model in $(find app/Models -name "*.php" -exec basename {} .php \;); do
    php artisan model:show "App\\Models\\$model"
done
```

**API routes** (run if ROUTES bucket triggered):
```bash
# Laravel's route:list gives a clean, accurate registered-route table (run from backend/).
cd backend && php artisan route:list --path=api --columns=method,uri,name,action
```

**Frontend components** (run if FRONTEND bucket triggered):
```bash
find web/src -name "*.tsx" \( -path "*/pages/*" -o -path "*/components/*" \) | sort
```

Replace the corresponding sections in ARCHITECTURE.md. Update the `<!-- Last updated: -->` header line.

---

## Step 3 — Patch FEATURES.md (if FEATURE bucket or any code change)

For each new or changed feature detected:

1. **New card added** → add a row to the "Live Features" table.
   - Feature name: card component name minus "Card"
   - PR: from `gh pr view <number> --json number,title`
   - Key files: the card `.tsx` + relevant API file + model
   - Notes: 1-line description of what it does

2. **Feature status changed** (e.g. planned → live) → update the row's Status column.

3. **PR with `fix(...)` prefix** touching an existing feature → add a note to the relevant row.

4. **Planned feature shipped** → move from "Planned / In Progress" table to "Live Features" table.

**Format for new live feature row:**
```
| Feature name | #PR CL-NNN | `api/X.py`, `models/X.py`, `cards/XCard.tsx` | One-line: what the user sees/does |
```

Update the `<!-- Last updated: -->` header line.

---

## Step 4 — Patch DECISIONS.md (only if DECISION bucket)

Add a new section at the bottom:
```markdown
## Decision title

Context: brief description of the decision.
Why: the reason this was chosen over alternatives.
Impact: what code conventions or rules follow from this.
```

Only add a decision entry when a PR/commit message explicitly captures a non-obvious architectural choice. Don't add routine implementation details.

---

## Step 5 — Patch OPERATIONS.md (only if OPS bucket)

Update the relevant table row or section:
- New workflow → add row to Deploy Workflows table
- Changed env var → add/update row in Environment Variables table
- New periodic task → add row to Celery Periodic Tasks table

---

## Step 6 — Commit to main

Verify all changes are under `documentation/kb/`:
```bash
git status --porcelain   # must show only documentation/kb/*.md
```

If anything outside `documentation/kb/` is staged, **abort** — do not push. Report to user.

```bash
git checkout main && git pull --ff-only
git add documentation/kb/
git commit -m "docs(kb): update knowledge base after PR #<number>"
git push origin main
```

Print: commit SHA, which KB files changed, and a one-line summary of what was updated.

---

## `full` mode — Regenerate all four files

Run Steps 2–5 regardless of bucket classification. Rebuild ARCHITECTURE.md from scratch using the live code. For FEATURES.md, DECISIONS.md, OPERATIONS.md — re-read all concept docs in `documentation/archive/` to verify no shipped feature is missing from the live table, then rebuild.

Full mode takes ~2–3 minutes and reads more files. Use sparingly.

---

## Output format

```
[kb] Analysed PR #104 — buckets: FEATURE, ROUTES
[kb] ARCHITECTURE.md — updated routes section (2 new endpoints)
[kb] FEATURES.md — added row: /audit skill (non-product, skip)
[kb] No DECISIONS changes detected
[kb] Committed: abc1234 — documentation/kb/ARCHITECTURE.md, FEATURES.md
```
