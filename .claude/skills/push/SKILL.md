---
name: push
description: "Full pre-push pipeline: update docs, review code, run tests, fix issues, commit, push, open a PR, and (with explicit confirmation) merge and watch deploys. Use when you want a quality-gated push to remote."
---

# Push Pipeline

Automated pre-push quality gate. Runs a full pipeline before pushing code to remote.

**IMPORTANT**: Execute every step sequentially. Do NOT skip steps. If a step fails after 3 attempts, stop and report to the user.

## Pipeline Steps

### Step 1 — Gather Context

1. Run `git status -sb` and `git diff --stat` to understand current changes.
2. Identify the current branch and remote tracking branch.
3. Read the project's README.md (root level).
4. Scan for CLAUDE.md, MEMORY.md, CHANGELOG.md, and any documentation directory.
5. Detect the project type (check for package.json, requirements.txt, composer.json, Cargo.toml, go.mod, etc.) and test infrastructure (pytest, jest, vitest, phpunit, pest, cargo test, go test, etc.).

### Step 2 — Update README

1. Read the current README.md.
2. Compare it against the actual project state:
   - Are listed features accurate and up to date?
   - Are setup instructions still correct?
   - Are API endpoints / commands / CLI flags current?
   - Is the tech stack description accurate?
   - Are badges, links, and references valid?
3. Update README.md with any corrections or additions. Keep the existing style and tone.
4. If no README.md exists, create a minimal one with: project name, description, setup, and usage.

### Step 3 — Update Skills & Commands Documentation

1. Check for skill/command definitions in:
   - `.claude/commands/`
   - `.claude/skills/`
   - `~/.claude/skills/`
   - `~/.claude/commands/`
2. If the project has CLI commands, slash commands, or skills:
   - Verify their documentation matches actual behavior.
   - Update descriptions, parameters, and examples if stale.
3. If the project has a commands/skills reference section in README or docs, update it.

### Step 4 — Update Project Documentation & Memory

1. Check for and update key documentation files:
   - CLAUDE.md — Ensure it describes THIS project accurately (correct tech stack, conventions, architecture). If it describes a different project, rewrite it for the current one.
   - CHANGELOG.md — Add entries for any unreleased changes not yet documented.
   - Any phase/milestone docs — Verify they reflect completed work.
2. Save relevant context to Claude memory (MEMORY.md) if the project has a memory directory:
   - Current project state and phase.
   - Key architectural decisions made in this session.
   - Known issues or tech debt discovered.
   - Do NOT duplicate information already in code or git history.

### Step 5 — Code Review

1. Run `/code-review-expert` on all current changes (staged + unstaged).
2. Review the findings.
3. **Automatically fix ALL findings** — P0, P1, P2, and P3. Do not ask for confirmation.
   - For each finding: understand the issue, implement the fix, verify it doesn't break other code.
   - If a fix is ambiguous or could have multiple valid approaches, choose the simplest one.
4. After fixing, run the review again to confirm all issues are resolved.
5. Repeat until the review comes back clean or only has cosmetic P3 items that are genuinely subjective.

### Step 6 — Create & Run Tests

1. Identify the test framework and configuration:
   - Python: pytest, unittest
   - JavaScript/TypeScript: jest, vitest, mocha
   - Other: detect from config files
2. Look at existing test files to understand patterns and conventions.
3. For each changed file, check if corresponding tests exist:
   - If tests exist: ensure they cover the new/changed code paths.
   - If no tests exist: create test files following the project's testing conventions.
4. Write tests that cover:
   - Happy path for new/changed functionality.
   - Edge cases and error handling.
   - Integration points (API endpoints, database queries, etc.).
5. Run the full test suite with coverage:
   - Python: `pytest --cov=app --cov-report=term-missing -q 2>&1` — capture the "TOTAL" line and any files below 70% coverage.
   - JavaScript: `npm test` or `npx vitest run --coverage` or `npx jest --coverage`
   - Use whatever test command the project defines in package.json/Makefile/etc.
6. **Surface coverage gaps in the PR body** — if any file touched by this change is below 70% line coverage, add a "Coverage gaps" section to the PR description listing the file, current %, and the specific missing lines. This is informational, not a blocker — the goal is visibility, not perfection on every PR.

### Step 7 — Fix Broken Tests

1. If any tests fail, analyze the failures:
   - Is it a bug in the test? Fix the test.
   - Is it a bug in the code? Fix the code.
   - Is it a flaky test? Make it deterministic.
   - Is it a missing dependency or setup? Add it.
2. Re-run tests after each fix.
3. Repeat until ALL tests pass.
4. If a test cannot be fixed after 3 attempts, skip it with a clear TODO comment explaining why, and report it to the user.

### Step 8 — Branch, Commit, Push & Create PR

**CRITICAL RULE: NEVER push directly to `main` or `development` UNLESS every changed path is under `docs/**`. Any code, config, schema, CI, infra, or dependency change always requires a feature branch + PR.**

#### Step 8a — Detect the docs-only fast path

Before deciding the branch strategy, classify the changes:

1. Run `git status --porcelain` and inspect every staged + unstaged path.
2. If **every** path is under `docs/**`, the changes qualify for the docs-only fast path. Skip to **Step 8c**.
3. Otherwise, follow the standard PR flow in **Step 8b**.

The fast path is for purely-additive documentation: deploy reports, post-mortems, design notes, ADRs that are being added or refined. It exists to remove ceremony for content that has zero blast radius (no deploy workflow triggers on `docs/**`, no behavior changes).

Watch-outs that disqualify the fast path even when the path looks doc-y:

- A README change that documents *new* CLI flags, env vars, or behavior — those are claims about code, so the code change must already be on main, otherwise the doc PR is lying. Use the standard flow.
- A `docs/superpowers/specs/*-design.md` for an in-flight project — load-bearing for downstream implementation. Standard flow.
- Any path outside `docs/**` (yes, even one stray `.gitignore` line) — standard flow.

When in doubt, use the standard flow.

#### Step 8b — Standard PR flow

1. **Ensure you are on a feature branch**:
   - If currently on `main` or `development`, create a new branch first:
     - Name it based on the changes: `feature/<topic>`, `fix/<topic>`, `chore/<topic>`, or `docs/<topic>`.
     - `git checkout -b <branch-name>`
   - If already on a non-main branch, stay on it.
2. Stage all changes: documentation updates, code fixes, new tests.
3. Create a well-structured commit (or multiple commits if changes are logically separate):
   - Use conventional commit format: `type(scope): description`
   - Types: feat, fix, docs, test, refactor, chore
   - Group related changes:
     - `docs: update README and project documentation`
     - `test: add tests for [changed modules]`
     - `fix: resolve code review findings`
     - Or a single commit if changes are small and cohesive.
4. Verify the commit(s) succeeded (check for pre-commit hook failures and fix if needed).
5. Push the feature branch to remote:
   - `git push -u origin <branch-name>`
6. **Create a Pull Request** using `gh pr create`:
   - Target branch: `development` (preferred) or `main` if no `development` branch exists.
   - Title: concise conventional-commit-style summary.
   - Body: include a summary of all changes (docs, fixes, tests), the review status, and test results.
   - Example:
     ```
     gh pr create --base development --title "feat(scope): summary" --body "..."
     ```
7. Report the result to the user with:
   - Branch name and remote.
   - Number of commits pushed.
   - PR URL.
   - Summary of what was updated (docs, tests, fixes).

#### Step 8c — Docs-only fast path (direct to main)

Use ONLY when Step 8a confirmed every path is under `docs/**`.

1. **Verify you're on `main`** and up to date: `git checkout main && git pull --ff-only`. If you're on a feature branch already, push that branch normally via Step 8b instead — the fast path is for the case where you have docs edits in a clean working copy on main.
2. Stage and commit the docs changes with a `docs(...)` conventional commit message.
3. Run any pre-commit hooks; fix issues and re-commit if needed.
4. Push directly: `git push origin main`.
   - If push is rejected (someone else pushed in the meantime), `git pull --rebase` and retry. Do NOT force-push.
5. Report to the user:
   - Branch: `main` (direct push, docs-only)
   - Commit SHA(s) pushed
   - Files added/changed (must all be under `docs/**`)
6. **Skip Steps 9 and 10 entirely.** No PR was opened, no deploy workflow will fire (path filters exclude `docs/**`), and there is nothing to merge or watch. Step 10 is also skipped because Step 8c is itself a docs commit — writing a deploy report about a deploy report would be circular. The pipeline ends at Step 8c.

### Step 9 — Merge & Deploy

**SKIP THIS STEP if Step 8 used the docs-only fast path (Step 8c).** No PR was created and no deploy workflow will fire on a `docs/**`-only push, so there is nothing to merge or watch. End the pipeline at Step 8c.

**CRITICAL RULE: Always confirm with the user before merging.** Merging into the default branch typically triggers production deploys — a shared-state, hard-to-reverse action. Even when auto mode is active, this step requires explicit user authorization. Do NOT auto-merge.

1. **Check PR CI status:**
   - Run `gh pr checks <PR-number>`.
   - If checks are still running, tell the user the current state and ask whether to wait (recommended) or proceed now.
   - If any required check has failed, stop and report the failures. Do NOT proceed.
2. **Identify the post-merge deploy workflows ahead of time:**
   - Inspect `.github/workflows/*.yml` for workflows that trigger on `push: branches: [main]` (or the equivalent base branch). Name them in the next step's confirmation prompt so the user knows what to expect.
3. **Confirm with the user before merging:**
   - State exactly what will happen: which branch will be merged into which target, which deploy workflows will fire, and any production side effects (containers restarting, CloudFront invalidations, DB migrations).
   - Wait for explicit approval. Do NOT merge without it.
4. **Merge the PR:**
   - Detect the repo's allowed merge methods via `gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed`.
   - Prefer `--merge` (merge commit) when allowed, otherwise `--squash`, otherwise `--rebase`.
   - Add `--delete-branch` to remove the feature branch on success.
   - Example: `gh pr merge <PR-number> --merge --delete-branch`.
5. **Watch the post-merge workflows:**
   - Run `gh run list --branch <base-branch> --limit 5` to find runs triggered by the merge.
   - For each running deploy workflow, stream output with `gh run watch <run-id>` (foreground until done) or poll `gh run view <run-id> --json status,conclusion` every ~30s. Report progress as workflows transition states.
6. **Verify the deploys succeeded:**
   - Check each workflow's `conclusion` is `success`. If any failed, run `gh run view <id> --log-failed` and surface the failing step's output to the user.
   - If the project has a health-check URL (look in README, deploy workflow steps, or ask), curl it: `curl -fsS <url>/health`.
7. **Final report:**
   - PR merge status and the commit SHA now on the base branch.
   - For each deploy workflow: name, conclusion, duration, run URL.
   - Health-check results, if performed.
   - Any post-deploy verification the user should still do manually (e.g., trigger a test error to confirm Sentry events arrive, click through a critical flow, watch a dashboard for the next N minutes).
8. **Sync local base branch:** after a successful merge, `git checkout <base-branch> && git pull --ff-only` so the local working tree matches remote. The merge happened on the server; the user will expect their local checkout to reflect it on the next command.
9. **Update knowledge graph (incremental) — MANDATORY when source code changed.**

   a. **Decide if a refresh is needed.** Skip ONLY if every PR-touched path is under `docs/**`, `documentation/**`, `.claude/**`, or pure config (yaml/toml/json/lockfiles with no `.py`/`.ts`/`.tsx`/`.js`/`.jsx`/`.go`/`.php`/etc. siblings). For ANY source-code touch in the PR, the refresh is required — not optional, not "skip if context is tight". This is the load-bearing step that keeps `.understand-anything/` from drifting silently across merges.

   b. **Run `/understand`** (incremental — ~$0.30–0.80). The skill auto-detects the existing graph and re-analyses only drifted files. Do NOT pass `--full` here; full re-runs cost ~$2.50–3.00 and are warranted only when the architecture changes materially (new service layer, major model restructure, large file moves) — always ask the user before a full run.

   c. **Verify the graph actually advanced.** After `/understand` reports completion, read `.understand-anything/meta.json` and confirm `gitCommitHash` now matches the post-merge `main` SHA from Step 9.4 / 9.8. If it still points at the previous baseline, `/understand` did not produce a new graph — stop and report the failure to the user; do NOT silently move on.

   d. **Commit and push** the updated `.understand-anything/` directly to `main` with a `chore(knowledge-graph): refresh from <short-sha>` message. It qualifies as a docs-only commit — no deploy workflow triggers on that path.

   e. **If you skipped the refresh** because the PR was docs/config-only (allowed under 9.a), say so explicitly in the final summary, e.g. "Knowledge graph: skipped — PR was docs-only". This makes the skip auditable; silent skips have repeatedly let the graph rot for many PRs in a row.

10. **Update documentation knowledge base:** run `/kb <pr-number>` to regenerate `documentation/kb/` from the merged changes. Skip if the PR touched only `docs/**`, `documentation/**`, or `.claude/**`. The `/kb` skill auto-detects changed buckets (models, routes, frontend, ops) and updates only the relevant KB files, then commits directly to `main`. Fast: ~30s, docs-only commit, no deploy trigger.

### Step 10 — Write the deploy report

**SKIP THIS STEP if Step 8 used the docs-only fast path (Step 8c) or if Step 9 was skipped/declined.** Only run this when a real production deploy actually shipped.

The deploy report is the canonical post-deploy trail in the repo — a Markdown summary of what shipped, where, how it verified, and what to watch next. It survives independent of GitHub Actions retention. Required even when CHANGELOG.md was already updated, because the audience (later maintainer / on-call / future Claude session) is different.

1. **Pick the path:** `docs/deploys/YYYY-MM-DD-<topic-slug>.md`. Lowercase-kebab slug. If multiple deploys ship the same day, the slug disambiguates.
2. **Mirror the existing format.** Read the most recent file in `docs/deploys/` and copy its structure exactly (header block, then sections for **What shipped**, **Deploy outcomes** table, **Verification**, **Manual follow-up**, **Likely failure modes**). Do not invent a new layout — the consistency is the point.
3. **Required header fields:**
   - `**Date:**` — today's date.
   - `**PR:**` — markdown link to the merged PR.
   - `**Merge SHA on `main`:**` — the SHA that landed (from Step 9.4 / Step 9.8).
   - `**Triggered by:**` — usually "push pipeline Step 9 (merge & deploy)".
4. **Required sections** (in this order):

   - **Push summary** — paste the same "Push complete" block you print to chat at the very end of the run, verbatim, as the first section under the header. This makes the report self-contained: a future maintainer opening the file gets the same headline summary the engineer who shipped saw, before they have to read the per-file detail. Format as a bulleted list, e.g.:
     ```
     ## Push summary

     - PR: [#71](...) — merged via merge-commit, branch deleted
     - Target: `main`
     - Commits: 1 feature commit (`feat(prefs): ...`) + 1 follow-up docs commit
     - Docs updated: CHANGELOG.md, new documentation/CONFIGURABLE-WEEK-START.md, new docs/deploys/2026-04-26-configurable-week-start.md
     - Tests: 112 passing (39 new in test_goals_utils.py rewrite + new test_user_preferences_schema.py)
     - Review: clean (14 findings — 2 P0, 3 P1, 4 P2 all addressed before push; remaining 5 P3 are notes/answers, not findings)
     - Merged SHA on `main`: `275da50`
     - Deploys:
       - deploy-backend: ✅ ~52s — <run url> (incl. Alembic migration `c3a5b4e0d1d2`)
       - deploy-web: ✅ ~42s — <run url>
     - Independent post-deploy probes:
       - `GET /api/v1/health` → `{"status":"healthy"}`
       - `GET /api/docs` → 200
       - `GET /` → `<title>...</title>`
     - Manual follow-up:
       - <one-line per item, mirroring the chat summary>
     ```
     The chat block and this section MUST stay in sync — write the chat summary first, then paste the same bullets here. Don't paraphrase.

   - **What shipped** — per-file bullet list with diff size and any non-obvious decisions, plus an explicit "no backend / no schema / no new deps" line if true.
   - **Deploy outcomes** — table with workflow / conclusion / duration / run URL. Include workflows that did NOT trigger and the path-filter reason ("path filter excludes `web/**`").
   - **Verification** — what was checked locally (browser, dev server, viewport), what the gate was (tsc, tests, manual), and that the production deploy job finished.
   - **Manual follow-up** — concrete checks the user should do post-deploy (URLs, viewports, dashboards to watch, error monitors). May overlap with the bulleted manual-follow-up in the Push summary above; the summary is the headline, this section is the detail.
   - **Likely failure modes** — CDN cache, service worker, wrong build deployed, environment-specific gotchas (e.g. multiple local checkouts).
5. **Commit and push direct to `main`:**
   - **Verify it's truly docs-only**: `git status --porcelain` must show only paths under `docs/**`. If anything else snuck in, abort the direct-push and use the standard PR flow instead.
   - `git checkout main && git pull --ff-only` (already done in Step 9.8).
   - `git add docs/deploys/<filename>.md`
   - `git commit -m "docs(deploys): <one-line summary> (YYYY-MM-DD)"` (use a HEREDOC for multi-line messages including the Co-Authored-By trailer).
   - `git push origin main` — this requires that the user / agent identity be in `bypass_actors` of the `main`-branch ruleset. If the push is rejected with `GH013: Repository rule violations`, the bypass is missing — fall back to the `docs/<slug>` PR-merge flow:
     ```
     git checkout -b docs/<slug>
     git push -u origin docs/<slug>
     gh pr create --base main --title "docs(deploys): ..." --body "..."
     gh pr merge <pr#> --merge --delete-branch
     git checkout main && git pull --ff-only
     ```
6. **Confirm:** print the commit SHA, file path, and a one-line note that no deploy workflow was triggered (path filters exclude `docs/**`).

Step 10 typically takes ~30s and produces a single docs commit on `main`. It is not optional when a real deploy shipped — repeated user feedback has established the deploy report as part of the pipeline, even though early versions of this skill did not include it.

## Error Handling

- **On main/development branch with non-docs changes**: NEVER push. Create a feature branch first, no exceptions. The docs-only fast path in Step 8c is the *only* exception, and it requires that every changed path be under `docs/**`.
- **Mixed change set in fast path**: If you start Step 8c thinking the changes are docs-only but discover a non-docs path mid-flow (e.g., a stray `.gitignore` or workflow edit), abort the fast path. Reset to a clean working copy on a new feature branch (`git stash; git checkout -b <branch>; git stash pop`) and run the standard PR flow in Step 8b.
- **Merge conflicts (during rebase or PR merge)**: Stop and ask the user how to resolve. Do NOT force-resolve.
- **Push rejected (non-fast-forward)**: Stop and ask the user whether to pull+rebase or force-push.
- **Auth failure**: Tell the user to authenticate manually.
- **Pre-commit hook failure**: Read the error, fix the issue, and retry the commit.
- **PR creation failure**: Show the error, suggest manual creation with the `gh` command.
- **PR CI failed (Step 9)**: Do NOT merge. Report the failing checks (`gh pr checks` output) and stop. Let the user decide whether to fix on the branch or override.
- **Branch protection blocks merge (Step 9)**: Surface the rule that blocked it (required reviews, required checks, linear history). Ask the user how to proceed — do not attempt to bypass.
- **Deploy workflow failed (Step 9)**: Run `gh run view <id> --log-failed` and report the failing step's output verbatim. Do NOT attempt to redeploy without user direction. Note that the merge has already landed on the base branch — surface the rollback options (revert PR, redeploy a previous SHA) but wait for the user to choose.
- **Deploy workflow timeout (Step 9)**: If `gh run watch` exceeds a sensible window (e.g., 25 min for backend, 10 min for static web), stop watching and report the current `status`/`conclusion`. Do NOT mark the pipeline as failed — let the user decide whether to keep waiting or investigate.
- **Health-check fails post-deploy (Step 9)**: Report the failing URL and HTTP status. Do NOT auto-rollback. Ask the user.

## Output Format

After each major step, print a status line:

```
[1/10] Context gathered — 5 files changed, Python+React project
[2/10] README updated — added 2 new endpoints, fixed setup instructions
[3/10] Skills docs — no changes needed
[4/10] Documentation updated — CLAUDE.md rewritten, CHANGELOG.md updated
[5/10] Code review — found 3 issues (P1: 1, P2: 2), all fixed
[6/10] Tests — created 4 new test files, 23 test cases
[7/10] All 47 tests passing
[8/10] Pushed 3 commits to origin/feature/my-branch -> PR #42 created
[9/10] Merged #42 (sha 1a2b3c4) -> deploy-backend ✅ 4m12s, deploy-web ✅ 1m45s, /health 200
[10/10] Deploy report committed: docs/deploys/2026-04-25-my-feature.md (sha abcd123)
```

Step 9 only runs after the user explicitly approves the merge. If the user declines or defers, stop after [8/10] and report the PR URL — Step 10 is skipped (no deploy happened, nothing to report).

**Docs-only fast path** (Step 8c): Steps 9 and 10 are skipped automatically. The pipeline ends at [8/10] with a different shape:

```
[8/10] Pushed 1 docs commit directly to origin/main (no PR, no deploy) — fast path
```

At the end, print a final summary:

```
Push complete.
- Branch: feature/my-branch -> origin/feature/my-branch
- PR: https://github.com/org/repo/pull/42 (merged via merge commit, branch deleted)
- Target: development
- Commits: 3
- Docs updated: README.md, CLAUDE.md, CHANGELOG.md
- Tests: 47 passing (23 new)
- Review: clean
- Merged SHA on base: 1a2b3c4
- Deploys:
  - deploy-backend: success (4m12s) — https://github.com/org/repo/actions/runs/123
  - deploy-web:     success (1m45s) — https://github.com/org/repo/actions/runs/124
- Health check: GET https://api.example.com/health -> 200
- Manual follow-up:
  - Trigger a test error to confirm Sentry events arrive in production.
  - Watch the error-rate dashboard for the next 30 min.
- Deploy report: docs/deploys/2026-04-25-my-feature.md (committed direct to main, sha abcd123)
```

If Step 9 was skipped (no merge), drop the merge/deploy/health/follow-up/deploy-report lines and end the summary at "Review: clean".

If Step 8c (docs-only fast path) was used, the final summary takes a much shorter form — there is no PR, no merge, no deploy:

```
Push complete (docs-only fast path).
- Branch: main (direct push)
- Commit(s): docs(deploys): add Sentry deploy report (667e305)
- Files: docs/deploys/2026-04-25-sentry-integration.md
- PR: none — fast path bypasses PR for `docs/**`-only changes
- Deploys: none — no workflow triggers on `docs/**`
```
