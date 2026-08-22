---
name: tdd
description: >-
  Runs red-green-refactor for ServiceToolPoC. Use when adding behavior, fixing
  bugs, writing Jest tests, or implementing under src/ or __tests__/.
---

# TDD

Copy this checklist and keep it updated:

```
TDD:
- [ ] Red: failing test, right reason
- [ ] Green: minimum production code
- [ ] Re-run: targeted tests pass
- [ ] Refactor: only after green
```

## Loop

1. **Red.** Add or extend a test in `__tests__/` that names the intended behavior. Run it. Confirm it fails because the behavior is missing, not because of a bad import or syntax error.
2. **Green.** Write the smallest production change that makes that test pass. No extra features.
3. **Re-run.** Run the same targeted tests, then broader tests if the change crosses layers.
4. **Refactor.** Clean up only while tests stay green.

Do not claim the work is done until the relevant tests pass.

Skip this loop for pure types, docs, or config. If a bug has no test, add a failing regression first.

## Commands

```bash
npm test -- __tests__/path/to/File.test.ts
npm test -- __tests__/path/to/File.test.ts -t 'test name'
npm test
```

Use the file path that mirrors the source. Prefer the focused command during red/green; run `npm test` before finishing a multi-file change.

## Where tests go

Mirror `src/` under `__tests__/`:

| Change | Test |
|--------|------|
| `src/domain/...` | `__tests__/domain/...` — unit, no mocks |
| `src/services/...` | `__tests__/services/...` — mock native BLE modules |
| `src/features/*/hooks/` | Prefer domain + service tests; hook test if the hook owns sequencing |
| `src/features/*/screens/` | RNTL smoke / interaction; mock the feature hook |
| Session bug (UUID, MTU, encoding, reconnect) | `__tests__/regressions/` |

Canonical examples: `__tests__/domain/telemetry/telemetry.test.ts`, `__tests__/features/client/useRecordingSession.test.ts`.

Layer and import rules: `.cursor/rules/architecture.mdc` and `docs/ARCHITECTURE.md`.
