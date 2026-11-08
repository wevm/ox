---
"ox": patch
---

Fixed `Base32.toBytes` and `Base32.toHex` accepting non-canonical input (non-zero trailing bits or an impossible length) by throwing `Base32.InvalidPaddingError`.
