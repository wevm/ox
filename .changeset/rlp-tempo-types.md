---
"ox": patch
---

Reduced the type instantiations of `Rlp.fromHex` and `Rlp.fromBytes` (about a third fewer) by writing out their `Options` and `ReturnType`, and of `TxEnvelopeTempo.deserialize` (about a third fewer) by dropping a redundant `Compute` from its return type and from `AuthorizationTempo.List`. The types are unchanged.
