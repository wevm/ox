---
"ox": patch
---

Unified the RPC-quantity conversion blocks across `Block`, `BlockOverrides`, and `StateOverrides` behind an internal helper so optional bigint fields with explicit `'0x0'` (e.g. `baseFeePerGas: '0x0'` on a post-merge block) round-trip as `0n` instead of being silently dropped by the previous truthy checks.
