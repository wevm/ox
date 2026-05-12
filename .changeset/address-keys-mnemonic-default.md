---
"ox": patch
---

Fixed `Mnemonic.toPrivateKey` to return `Bytes` by default to match its declared return type -- previously it returned a `Hex` string at runtime even though the default `as` was `'Bytes'`.
