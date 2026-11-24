---
"ox": patch
---

Improved `AbiParameters.decode` performance on data of up to 64 bytes: it copies words instead of viewing them, which V8 would first move to an `ArrayBuffer` of their own (one `uint256` 547 → 328 ns, one `address` 629 → 456 ns).
