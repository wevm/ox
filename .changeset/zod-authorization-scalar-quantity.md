---
"ox": patch
---

Fixed the `ox/zod` `Authorization.Signed` schemas (and so `Transaction.Eip7702`) to accept RPC `r` and `s` values below `2**248`, which nodes send without leading zeros, decoding them to 32-byte hex like `Authorization.fromRpc` and encoding them back to quantities.
