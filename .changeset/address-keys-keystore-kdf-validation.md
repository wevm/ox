---
'ox': patch
---

Added validation of KDF parameters in `Keystore.pbkdf2`, `Keystore.pbkdf2Async`, `Keystore.scrypt`, and `Keystore.scryptAsync` -- PBKDF2 now requires `iterations` to be an integer `>= 1000`, and scrypt now requires `n` to be a power of two `>= 1024` with positive integer `r` and `p`, rejecting trivially weak parameters that previously produced formally valid but cryptographically insecure keystores.
