---
title: 'AGENTS.md references missing check:tsdoc script'
severity: 'minor'
---

### Check existing issues

- [x] I checked there isn't [already an issue](https://github.com/wevm/ox/issues) for the bug I encountered.

### Ox Version

1.2.0

### Current Behavior

The repository instructions require `pnpm check:tsdoc`, but `package.json` does not define that script. The command fails before checking TSDoc.

### Expected Behavior

The documented verification command exists or the instructions name the available command.

### Steps To Reproduce

Run `pnpm check:tsdoc`.

### Link to Minimal Reproducible Example

Not applicable.

### Anything else?

Discovered while verifying incremental WASM hash factories.
