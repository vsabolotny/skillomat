---
name: implement
description: "Use when the user invokes /implement or asks to implement a feature, bugfix, or ticket end-to-end. Trigger phrases: 'implement following request', 'implement <ticket-id>', '/implement <X>'."
argument-hint: [request | ticket-id]
disable-model-invocation: true
---

# Implement — Request → Approved Plan → Code → Tested → Push

End-to-end implementation pipeline with **two human approval gates**: plan approval before any code is written, and local-test approval before handing off to the `push` skill. Stop at each gate. Do NOT auto-advance.

`$ARGUMENTS` is either a free-form request or a ticket ID. If the first whitespace-separated token matches `^[A-Z]+-\d+$` (e.g. `DW-123`, `PROJ-42`), treat it as a ticket ID and fetch its context; otherwise treat the whole argument as a description.

## Iron rules

- **Both approval gates are mandatory.** Plan-approve (Step 6) and local-test-approve (Step 9). No "approval-by-silence". No carrying forward an earlier "go" to skip the second gate.
- **NEVER work on `main`.** Always branch from the latest `origin/main`.
- **No commits in Steps 1–9.** The first commit happens inside the `push` skill at Step 10.
- **Functional tests are part of Step 7, not a follow-up.** A change without tests is not done.
- **Fix root causes, not symptoms.** If a baseline check or test fails, diagnose; don't paper over it with skips or `--no-verify`.
- **No hardcoded secrets reach a commit.** Run the Step 7 secret scan before handing off to `push`. Remove or externalize anything a scanner would flag — including test-only keys (a `phpunit.xml` `APP_KEY`, a fake AWS key); GitGuardian/gitleaks flag those too and will block the PR.

## Pre-flight — run before Step 1

Before any edits, run a pre-flight check and confirm with the user which repo and branch you're targeting:

```bash
pwd
git branch --show-current
git status
lsof -i :3000 -i :3002 -i :8000   # list any running dev servers
```

**Do NOT touch sibling clones.** If `pwd` doesn't match the repo the user has in mind, stop and ask. Common case on this machine: `drinkwise/` and `drinkwise2/` exist side-by-side; editing the wrong one collides with whichever dev server is up out of the other clone and produces a misleading diff.

## Workflow

### Step 1 — Classify the request

**Reset session context first.** Before classifying, check whether this conversation already contains turns from a prior `/implement` run (or any unrelated prior work). If it does, do NOT proceed — stop and print exactly:

> This is a fresh `/implement` request. Please run `/clear` to drop the previous session's context, then re-invoke `/implement <ticket-or-description>` so this run starts clean.

Then halt the skill until the user re-invokes `/implement` after running `/clear`. The previous run's plans, gates, tool outputs, concept docs, and code-review chatter sit in the conversation history and burn tokens on every subsequent prompt — carrying them forward across `/implement` runs is the single biggest waste in this workflow.

You are *not* able to invoke `/clear` yourself — it's a CLI-side command, not an agent tool. The user must type it. Your job is to *gate* on it: refuse to proceed until the conversation is empty.

Skip this guard only when the conversation is already empty — i.e. this is the first agent turn after a fresh session start or a recently-issued `/clear`. In that case, proceed directly to the classification below.

---

Decide branch type from signal words in the request:

| Signal | Type | Prefix |
|---|---|---|
| "bug", "broken", "fix", "error", "regression", "not working", "crash" | bugfix | `fix/` |
| Otherwise | feature | `feature/` |

Build a kebab-case slug (3–5 words, no articles). If a ticket ID was given, prepend it.

Examples:
- `"dark mode toggle"` → `feature/dark-mode-toggle`
- `"DW-123 mood tooltip clipped on mobile"` → `fix/DW-123-mood-tooltip-clipped`

### Step 2 — Branch from the latest `main`

```bash
git fetch origin main
git switch main
git pull --ff-only origin main
git switch -c <branch-name>
```

If the working tree is dirty, STOP and ask before stashing. If `git pull --ff-only` fails (local main diverged), STOP and ask.

### Step 3 — Health-check the baseline

Before writing code, confirm `main` itself is green and build a diagnostic context block. Detect and run only what exists in the project:

1. **Type check — capture output as context, don't just gate.**
   - TypeScript: `cd web && npx tsc --noEmit 2>&1` — paste ALL errors verbatim as a "Known type errors" block. Stop only if >20 errors (suggests fundamentally broken `main`).
   - Python: `cd backend && python -m mypy app --ignore-missing-imports 2>&1 | grep "error:" | head -30` — paste errors as a "Known mypy errors" block. Stop only on errors that directly affect the files you'll touch.
   - These error blocks are **diagnostic context for Steps 4–7**, not just pass/fail gates. Reading them is cheaper than reading the files they describe.

2. **Lint** — `eslint`, `ruff`, `flake8`, project lint script. Stop on failures.

3. **Tests** — vitest, jest, pytest, etc. Stop on failures.

4. **Build** — only if it's fast (<30s).

5. **Churn map (10 seconds, always run):**
   ```bash
   git log --name-only --format="" -- "*.py" "*.ts" "*.tsx" | grep -v "^$" | sort | uniq -c | sort -rn | head -15
   ```
   Paste result as a "Hotspot files" block. Before opening any file in Step 4, check if it's in the top 10 — high-churn files have higher blast radius and deserve extra care.

**Skip when state hasn't changed since the last successful baseline this session.** Specifically, you may skip Step 3 if all three hold: this is the second-or-later `/implement` in the same Claude Code session; `git fetch origin <base> && git pull --ff-only` reports "Already up to date"; and `git status` shows no working-tree drift from what you saw at the previous successful baseline. In that case, the baseline you established earlier in the session is still valid and re-running typecheck/lint/tests on the same SHA is pure overhead. Print one status line stating you're reusing the prior baseline and the SHA it was established at.

If the baseline is **known-broken in a documented way** (e.g. the project's own concept doc lists pre-existing tsc errors as out-of-scope), record the error count once and treat that count as the baseline. The gate is "no NEW errors introduced," not "zero errors."

Any failure in items 2–4 → STOP. Don't build on broken `main`. Report what failed and ask the user how to proceed. Type errors from item 1 are context, not stoppers (unless >20).

### Step 4 — Gather context

If `$ARGUMENTS` is a ticket ID, fetch the ticket first (Atlassian / Linear / GitHub Issues — whichever is configured).

**DB-touching tasks only:** before reading any model file, generate a compact schema snapshot:
```bash
cd backend && python3 -c "
import os, re
for fname in sorted(os.listdir('app/models')):
    if not fname.endswith('.py') or fname.startswith('_'): continue
    src = open(f'app/models/{fname}').read()
    tbl = re.search(r'__tablename__\s*=\s*[\"\'](.*?)[\"\'']', src)
    if not tbl: continue
    print(f'-- {tbl.group(1)}')
    for m in re.finditer(r'(\w+)\s*=\s*Column\(([^)]+)\)', src):
        print(f'  {m.group(1)}: {m.group(2)[:60]}')
    print()
" 2>/dev/null
```
Paste as a "Schema snapshot" block. This prevents column-name hallucination and costs ~1,200 tokens vs reading 10 model files.

Then explore the codebase. For non-trivial changes, dispatch the **Explore** subagent so the main context isn't burned on file reads:
- Identify all files likely to change.
- Cross-reference against the hotspot map from Step 3 — files that are both in scope AND in the top 10 churn need the most careful review.
- Read affected code paths end-to-end.
- Locate existing tests for that area.

**When NOT to dispatch Explore.** The subagent has fixed overhead (its own prompt, file reads, summary writeup) that exceeds the value of the search at small scale. Skip it and read the files directly when:

- The ticket names a single file/component AND a quick `grep -rn` confirms ≤ 3 files in scope.
- You estimate the diff at < 20 lines (literal-text removal, copy tweak, single-prop addition, one-line bugfix).
- You already explored the relevant area earlier in this session (consecutive `/implement` runs against the same component).

When the ticket description is just an error message or a screenshot, treat the production error tracker (Sentry / Rollbar / etc., when configured) as the first stop — the unminified error and component stack frame is usually more diagnostic than reading the whole component.

For ambiguous feature requests where intent isn't crisp, invoke `superpowers:brainstorming` first to lock requirements before drafting the concept.

### Step 5 — Produce a plan

Match the plan's weight to the change's weight. There are three tiers.

**Feature, > ~30 LOC or multi-file or non-obvious UX → persisted concept doc.** Save to `documentation/<FEATURE-SLUG>.md` (or whichever path `CLAUDE.md` specifies for concept docs). Sections:
- **Goal** — user problem solved (1–3 sentences).
- **UX / behavior** — what the user sees and does.
- **Technical approach** — files, components, data flow, API shape.
- **Out of scope** — what this intentionally does NOT do.
- **Open questions** — anything the user must decide first.
- **Test plan** — functional tests Step 7 will add.

**Micro-feature, ≤ ~30 LOC AND ticket title fully describes the change → inline plan in chat.** Present a tight summary in chat (5-10 bullets covering: what, where, what stays untouched, regression risk, test plan). Skip the persisted concept doc — it would be longer than the change. This applies to literal-text removals, copy tweaks, single-prop additions, simple visibility flips, etc.

**Bugfix → inline fix plan.** Present in chat, do not persist. Sections:
- **Root cause** — what's actually wrong, with `file:line` references.
- **Fix approach** — minimal diff that addresses the root cause.
- **Why this is the right fix, not a band-aid** — explicitly rule out symptom-patching.
- **Regression risk** — what could break, what test catches it.
- **Test plan** — including a regression test that fails on broken code and passes on the fix.

When in doubt, prefer the lighter tier. The user can always ask for a persisted doc; you can always upgrade an inline plan to a doc if the design surface turns out to be larger than expected mid-implementation.

### Step 6 — Present the plan and STOP for approval (Gate 1)

Print the plan (or the concept-doc path with a 5-bullet summary) and ask:

> Ready to implement this plan? Reply **approve** to proceed, or tell me what to change.

Do NOT touch any code file until the user replies with explicit approval ("approve" / "ok" / "go" / "looks good"). If they request changes, revise and re-present. Loop until approved.

### Step 7 — Implement and test

Once approved:

1. Implement the change. Apply project conventions from `CLAUDE.md` and existing style configs. Prefer small, well-named functions over comments. No speculative abstractions, no dead code, no defensive coding for impossible states.
2. Write **functional tests** for the new behavior:
   - Happy path.
   - Edge cases the plan called out.
   - Regression test for any bug fixed (must fail on broken code, pass on fix).
3. Use TDD where applicable — see `superpowers:test-driven-development`.
4. Run the full test suite — all tests must pass.
5. Run typecheck and lint — both must pass.
6. **Secret scan (mandatory) — no hardcoded credentials reach a commit.** The first commit happens in `push` (Step 10), so this read-only scan is the last line of defense before code leaves the machine. Scan everything this branch adds or changes:

   - **Prefer a real scanner if one is installed** — run it over the change set:
     ```bash
     gitleaks detect --no-banner --source . 2>/dev/null \
       || ggshield secret scan path -r . 2>/dev/null \
       || trufflehog filesystem . 2>/dev/null
     ```
   - **Fallback grep (always available).** Compare against the base branch; for a greenfield repo (no `origin/main`) run `git add -A` first and use `git diff --cached`:
     ```bash
     BASE=$(git merge-base origin/main HEAD 2>/dev/null)
     RANGE=${BASE:+$BASE..}
     # keyword-assigned secrets
     git diff $RANGE 2>/dev/null | grep -nEi \
       '(pass(word|wd)?|secret|api[_-]?key|access[_-]?key|client[_-]?secret|token|bearer|private[_-]?key|aws_(secret|access)|app_key)[[:space:]]*[:=][[:space:]]*.{6,}' \
       | grep -vEi 'env\.example|redacted|changeme|example|your[_-]|<[^>]+>'
     # known key formats / high-entropy
     git diff $RANGE 2>/dev/null | grep -nE \
       'base64:[A-Za-z0-9+/]{30,}=|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}\.'
     ```
   - **Confirm no real `.env` is tracked** (only `.env.example` with placeholders should be):
     ```bash
     git ls-files | grep -E '(^|/)\.env$' && echo "WARNING: a real .env is tracked"
     ```
   - **Triage every hit:**
     - Real secret (prod credential, private key, live token) → remove it, move to env/secret manager, and rotate it if it was ever real.
     - Test-only value that still matches a detector (e.g. a Laravel `APP_KEY` in `phpunit.xml`, a dummy AWS key) → still do not commit it; generate it at runtime/CI, or drop the test that needs it. Scanners flag these regardless of intent.
     - Local dev defaults (e.g. a `docker-compose` MySQL password) → acceptable, but keep them obviously non-production and never reuse a real value.

   Do NOT proceed to Step 10 until the scan is clean or every remaining hit is a justified, non-secret value you can name.

If anything fails, fix the root cause. Stuck after 2 attempts → surface the failure to the user.

### Step 8 — Make the change locally testable for the user

Before asking the user to test, the change must actually be reachable in their environment:

1. **Detect the dev command** in `package.json` scripts (`dev`, `start`) or project Makefile.
2. **Check if a dev server is already running** — `lsof -i :<port>` or `pgrep -f <vite|next|webpack-dev-server>`. The user may run the dev server from a separate working copy; consult `CLAUDE.md` and project memory for clues.
3. **Decide:**

| Situation | Action |
|---|---|
| HMR-capable server already running (vite, next dev) | Code is live — tell the user what to refresh and what to look for. |
| Non-HMR server already running | Kill it gracefully (`kill -TERM <pid>`) and restart in the background. |
| Not running | Start it in the background. Poll the port until listening — don't blind-sleep. |
| Server-side / no UI | Skip; give the user the test command instead. |

Print the exact URL/command and the specific behavior to verify, e.g.:
`Open http://localhost:5173/settings → toggle "Dark mode" → background should switch to #111`

### Step 9 — Wait for the user's verdict (Gate 2)

Ask:

> Test it locally and let me know — **approve** to push, or tell me what's off.

If the user reports issues:
- Implementation flaw → back to Step 7.
- Plan flaw → back to Step 5.

If the user approves, proceed to Step 10.

### Step 10 — Hand off to `push`

Invoke the `push` skill via the Skill tool. Do NOT manually `git commit` or `git push` — `push` owns all git history, the PR, the merge gate, and the deploy report.

## Red flags — STOP

| Thought | Reality |
|---|---|
| "Baseline is probably fine, skip Step 3 on the first run" | A flaky `main` contaminates everything you build on it. Run the checks at least once per session. The skip-conditions in Step 3 only apply on the *second-and-later* `/implement` run when state is provably unchanged. |
| "The plan is obvious, I'll just code" | Gate 1 is mandatory. Plan first, code second. |
| "User said 'go' three messages ago — that's still approval" | Approval is per-gate. Plan-approve ≠ push-approve. |
| "I'll commit as I go, push will pick them up" | No commits before Step 10. `push` handles all git. |
| "Tests slow me down, I'll add them after" | Functional tests are Step 7, not a follow-up. |
| "It works in my agent shell — good enough" | The user runs the dev server elsewhere. Confirm reachability before asking them to test. |
| "User's busy, I'll push and report" | Pushing without Gate 2 has burned us. Wait. |
| "Ticket says X but I'd build Y instead" | Surface the disagreement in Step 5 before coding, not silently. |
| "It's just a test key, the scanner won't care" | GitGuardian/gitleaks flag test keys too and block the PR. Generate keys at runtime/CI; never commit them. Run the Step 7 secret scan. |

## When NOT to use

- User has already started implementing → just edit; don't restart the lifecycle.
- User wants only a plan, no implementation → use `tackle` (Jira) or just plan inline.
- User wants to push existing local changes → use `ship` or `push`.
- Documentation-only change → edit and use the docs-only fast path in `push`.

## Output format

After each step, print one status line:

```
[1/10] Classified as feature → branch feature/dark-mode-toggle
[2/10] Branched from origin/main (sha 1a2b3c4)
[3/10] Baseline green — typecheck/lint/tests pass on main
[4/10] Context gathered — 4 files in scope, existing tests in src/__tests__/settings.test.ts
[5/10] Concept written: documentation/DARK-MODE.md
[6/10] Plan presented — waiting for approval (Gate 1)…
[7/10] Implemented + tests pass + secret scan clean (3 new test cases, 47 total)
[8/10] Dev server already running on :5173 (HMR live) — visit /settings
[9/10] Local testing — waiting for approval (Gate 2)…
[10/10] Handing off to /push
```
