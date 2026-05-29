---
"ox": minor
---

Added support for TIP-1053 (witnesses in key authorizations). `KeyAuthorization` and its RPC/tuple representations now accept an optional 32-byte `witness` field that is included in the signing hash, letting a single signature both authorize an access key and bind to an arbitrary application context (e.g. a server-issued challenge).
