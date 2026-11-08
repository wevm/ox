---
"ox": patch
---

Fixed `Siwe.validateMessage` accepting a message with a nonce shorter than 8 alphanumeric characters or a version other than `1`, which EIP-4361 does not allow.
