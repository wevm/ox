---
"ox": patch
---

Fixed `KeyAuthorization` expiry documentation and `fromRpc` handling. The comment `(0 = never expires)` was incorrect — the Tempo protocol treats `expiry == 0` as a non-existent key in storage. The correct way to represent "never expires" is to omit the `expiry` field (`undefined`), which the node stores as `u64::MAX`. Also fixed `fromRpc` to preserve `undefined` expiry instead of defaulting to `0`.
