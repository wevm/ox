---
'ox': patch
---

Replaced the `Provider.parseError` `if` ladder with a code, constructor lookup table so EIP-1193 error dispatch is O(1) instead of linear in the number of known provider codes.
