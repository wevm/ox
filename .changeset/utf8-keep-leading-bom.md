---
"ox": patch
---

Fixed `Hex.toString`, `Bytes.toString`, and `AbiParameters.decode` to keep a leading U+FEFF in decoded strings instead of dropping it as a byte order mark.
