---
'ox': patch
---

Fixed `Transaction.fromRpc` clobbering legacy (`type: '0x0'`) `v` with `27`/`28`; the original RPC `v` is now preserved when present.
