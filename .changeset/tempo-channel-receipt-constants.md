---
"ox": patch
---

Precomputed the constant hashes in `Channel` and wrote its and `ReceivePolicyReceipt`'s ABI items out as JSON, so importing either module no longer hashes or parses ABI at load, and their constants no longer bundle the ABI parser.
