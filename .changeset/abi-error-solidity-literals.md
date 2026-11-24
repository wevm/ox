---
"ox": patch
---

Wrote `AbiError.solidityError` and `AbiError.solidityPanic` out as literals with the signature hashes `AbiError.from` adds, instead of calling `AbiError.from` at module load, so using either no longer bundles the ABI parser and keccak (9.7 kB to 155 B gzipped).
