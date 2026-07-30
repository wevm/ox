---
title: 'size-limit emits an invalid Hex import'
severity: 'minor'
---

### Check existing issues

- [x] I checked there isn't [already an issue](https://github.com/wevm/ox/issues) for the bug I encountered.

### Ox Version

1.2.0

### Current Behavior

Running `pnpm size` generates `import { Hex.assert }` from the configured dotted import and fails in webpack before checking any bundle limits.

### Expected Behavior

The size check accepts the configured member import or expresses the entry in syntax that size-limit can bundle.

### Steps To Reproduce

1. Run `pnpm build`.
2. Run `pnpm size`.

### Link to Minimal Reproducible Example

Not applicable.

### Anything else?

Passing a temporary entry file directly to size-limit bypasses the broken package entry and exposes the remaining bundle checks.
