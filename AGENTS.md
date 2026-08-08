# Project Instructions

## General

- Preserve the existing architecture.
- Inspect existing code before implementing anything.
- Reuse existing services, components, DTOs, entities, utilities, and patterns.
- Make the smallest change necessary.
- Do not modify unrelated files.
- Do not refactor unrelated working code.
- Do not introduce new dependencies unless necessary.
- Do not duplicate existing functionality.

## Repository Exploration

- Prefer targeted searches over broad repository scans.
- Use the existing Graphify graph when relationships or impact are unclear.
- Inspect only files relevant to the current task first.
- Do not repeatedly read files already understood.
- Expand the search scope only when necessary.

## Backend

- Follow the existing Spring Boot architecture.
- Preserve Controller -> Service -> Repository patterns.
- Keep business logic out of controllers.
- Reuse existing DTOs, entities, services, repositories, and mappers.

## Frontend

- Follow the existing React structure.
- Reuse existing components, hooks, utilities, and API clients.
- Do not duplicate UI or API logic.

## Debugging

- Start from the actual error or failing behavior.
- Inspect the most likely related files first.
- Form one hypothesis at a time.
- Avoid unrelated refactoring.

## Verification

- Run targeted tests or checks first.
- Do not run the full test suite unless necessary.

## Final Response

- Keep responses concise.
- Report changed files.
- Report verification results.
- Mention only important caveats.

## Available Skills

Use repository skills when applicable:

- `code-edit`: Use for implementing or modifying functionality with minimal repository exploration.
- `debug`: Use for bugs, exceptions, failing requests, incorrect behavior, and test failures.
- `graphify`: Use the existing graph when repository relationships, dependencies, call paths, or impact analysis are unclear.

Prefer the relevant skill instead of inventing a new workflow.