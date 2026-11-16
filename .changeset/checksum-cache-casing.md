---
"ox": patch
---

Improved `Address.checksum` to compute the checksum once for every casing of an address and cache it only under the lowercase address, and fixed the cache to refresh an entry on write and to evict an empty-string key.
