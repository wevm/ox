---
"ox": patch
---

Fixed `Keystore.scryptAsync` to honor caller-provided `p` and `r` options -- previously they were silently overridden with `p=8` and `r=1`, producing keystores that disagreed with the synchronous `Keystore.scrypt` for the same inputs.
