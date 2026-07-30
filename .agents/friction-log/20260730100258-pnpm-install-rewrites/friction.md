---
title: 'pnpm install rewrites contract bytecode with the local Forge compiler'
severity: 'minor'
---

### Check existing issues

- [x] I checked there isn't [already an issue](https://github.com/wevm/ox/issues) for the bug I encountered.

### Ox Version

1.2.0

### Current Behavior

Running `pnpm install --frozen-lockfile` executes postinstall and rewrites `contracts/generated.ts` when the local Forge compiler differs from the committed output.

### Expected Behavior

A dependency-only install should not introduce unrelated contract bytecode churn.

### Steps To Reproduce

1. Create a clean worktree.
2. Run `pnpm install --frozen-lockfile` with Forge using a different compatible compiler.
3. Run `git status --short`.

### Link to Minimal Reproducible Example

Not applicable.

### Anything else?

The current workaround is to inspect and restore `contracts/generated.ts` after installation.
