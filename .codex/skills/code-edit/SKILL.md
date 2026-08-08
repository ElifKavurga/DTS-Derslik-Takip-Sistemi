---
name: code-edit
description: Minimal and efficient workflow for implementing features and modifying existing code.
---

# Efficient Code Editing

Use this skill for feature implementation, small code changes, and modifications to existing functionality.

## Workflow

1. Identify the smallest relevant part of the repository.
2. Inspect existing implementation before changing code.
3. Reuse existing architecture, services, components, DTOs, entities, utilities, and patterns.
4. Use the existing Graphify graph when relationships or impact are unclear.
5. Make the minimum necessary change.
6. Do not modify unrelated files.
7. Do not perform broad refactoring unless the task requires it.
8. Run targeted verification.
9. Stop when the requested task is complete.

## Repository Exploration

Prefer:

- targeted searches
- directly related files
- existing Graphify data
- existing project patterns

Avoid:

- scanning the whole repository without reason
- repeatedly opening the same files
- reading unrelated modules
- speculative architecture exploration

## Implementation Rules

- Prefer modifying existing code over creating parallel implementations.
- Do not duplicate existing functionality.
- Do not add unnecessary abstractions.
- Do not add dependencies unless required.
- Do not rewrite entire files for small changes.
- Preserve existing naming and folder conventions.

## Final Response

Keep the final response concise.

Report only:

- what changed
- changed files
- verification result
- important caveats