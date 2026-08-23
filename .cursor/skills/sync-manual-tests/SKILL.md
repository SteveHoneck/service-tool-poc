---
name: sync-manual-tests
description: Catch-up sync of docs/MANUAL_TESTS.md from recent chats, the plan, and README. Use when the user asks to sync manual tests, harvest scenarios from chats, or update the manual test list after a feature/bug chat.
disable-model-invocation: true
---

# Sync manual tests

Run **locally** (not a cloud agent). Canonical file: `docs/MANUAL_TESTS.md`. Diff against it; do not rewrite from scratch.

## Sources

1. `docs/MANUAL_TESTS.md` (read first — source of truth)
2. `README.md` Usage / demo
3. Plan: `~/.cursor/plans/rn_service_tool_poc_0ae79b3f.plan.md`
4. Conversation search, several 1–2 keyword queries: manual, reconnection, recording, BLE, firmware, walk away, Create Report, demo
5. Transcripts: `~/.cursor/projects/Users-a267357-Projects-ServiceToolPoC/agent-transcripts/`
6. `@Chats` the user attached

## Keep

- Durable two-phone (or device) scenarios with setup, steps, and pass criteria
- Status: `current` | `feature/<branch>` | `planned`

## Drop

- Duplicates of an existing `id`
- Jest / unit-only cases
- One-off debug (UUID, MTU, encoding, Metro cache)
- Undecided UX (keep as `planned` with “do not test as decided”)

## Edit

- New scenario → new `kebab-case` id
- Behavior change → update the existing id
- Merged to `main` → promote Status to `current`; retire checks the new UI replaced
- Cite source (path or chat title)

Propose a patch to `docs/MANUAL_TESTS.md`. If nothing new, say so.
