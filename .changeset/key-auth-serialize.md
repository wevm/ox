---
"ox": patch
---

`ox/tempo`: Added `KeyAuthorization.serialize` and `KeyAuthorization.deserialize` for RLP encoding/decoding key authorizations.

`ox/tempo`: Fixed `KeyAuthorization.toTuple` to always include expiry in the tuple when limits are present, preventing malformed RLP encoding.
