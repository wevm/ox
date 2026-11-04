---
"ox": patch
---

Added `userAddress` to `AccountOperation` transaction operations, so a configurable account acting as an access key (TIP-1111) can collect owner approvals and serialize a keychain V2 envelope for its parent.
