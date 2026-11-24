---
"ox": patch
---

Made `AbiParameters.decode` (and the ABI decoders built on it) faster for short data: the decoder copies words out of data of up to 64 bytes instead of taking views of it, which made V8 move the data to an `ArrayBuffer` first, and `Bytes.toBigInt` reads a fresh word without one. `AbiParameters.decode` of one word runs about 1.6x faster; the output and errors are unchanged.
