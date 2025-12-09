---
"ox": patch
---

Aligned ERC‑8021 Schema 1 serialization, deserialization with EIP‑8021 (variable‑length chainId)

* Updates `Attribution.fromData` to deserialize the variable length registry section from schema 1
* Updates `Attribution.toDataSuffix` to serialize the variable length registry section when schema 1
