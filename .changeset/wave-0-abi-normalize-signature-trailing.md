---
"ox": patch
---

Fixed `internal.normalizeSignature` to reject trailing characters after the closing parenthesis of an ABI item signature instead of silently truncating them.
