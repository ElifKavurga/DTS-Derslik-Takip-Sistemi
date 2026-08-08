---
name: debug
description: Efficient debugging workflow focused on root cause analysis with minimal repository exploration.
---

# Efficient Debugging

Use this skill for bugs, exceptions, failed requests, test failures, and incorrect behavior.

## Workflow

1. Start from the actual error message, stack trace, logs, or reproducible behavior.
2. Identify the most likely failing component.
3. Inspect only directly related files first.
4. Use the existing Graphify graph when dependency or call relationships are unclear.
5. Form one hypothesis at a time.
6. Test the cheapest plausible hypothesis first.
7. Find the root cause before changing code.
8. Make the smallest fix necessary.
9. Verify that the original failure is resolved.
10. Stop after successful verification.

## Avoid

Do not:

- scan the entire repository immediately
- rewrite working code
- perform unrelated refactoring
- create speculative fixes
- run unrelated tests
- repeatedly inspect already-understood files
- change multiple unrelated areas at once

## Verification

Prefer:

- reproducing the original bug
- targeted tests
- focused logs
- checking the smallest affected flow

Run broader verification only if the fix may affect multiple modules.

## Final Response

Report briefly:

- root cause
- fix
- changed files
- verification result