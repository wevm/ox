---
"ox": patch
---

Improved performance and memory use of `Blobs.from`, `Blobs.to`, `AbiParameters.decode`, `Bytes.toBigInt`, `TypedData` hashing (type hashes are now cached), `Base58` encoding and decoding, `Hex.validate` and `Bytes.validate` (which no longer throw and catch internally), and concurrent `VirtualMaster.mineSaltAsync` worker pool setup.
