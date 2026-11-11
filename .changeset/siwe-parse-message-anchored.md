---
"ox": patch
---

Fixed `Siwe.parseMessage` to return an empty object when a message has text that is not part of the EIP-4361 prefix or suffix, such as `Expiration Time` and `Not Before` lines that are out of order, and to parse in linear time.
