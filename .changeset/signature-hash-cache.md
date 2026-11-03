---
"ox": patch
---

Improved `AbiItem.getSignatureHash` and `AbiItem.getSelector` performance, along with the selector lookups in `AbiItem.fromAbi`, `AbiFunction.decodeData`, `AbiEvent.decodeLog` and `AbiEvent.extractLogs`, by caching signature hashes by normalized signature in a bounded cache that `Caches.clear` resets.
