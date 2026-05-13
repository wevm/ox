---
"ox": minor
---

Added `tempo` `ZoneRpcAuthentication.prepare` to pre-compute `fields`, `hash`, `serialized`, and the request `header` once for the common case where the same signed token is reused across many RPC requests.
