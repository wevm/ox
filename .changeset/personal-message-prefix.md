---
"ox": patch
---

Hoisted the invariant `0x19 ‖ "Ethereum Signed Message:\n"` ERC-191 prefix in `PersonalMessage.encode` to a precomputed module constant so each call only encodes the per-message length suffix instead of re-encoding the full prefix string.
