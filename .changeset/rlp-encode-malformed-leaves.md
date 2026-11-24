---
"ox": patch
---

Fixed `Rlp.from`, `Rlp.fromHex` and `Rlp.fromBytes` accepting malformed hex leaves: a leaf with a non-hex digit, without a lowercase `0x` prefix (including `0X…`, which `Hex.validate` and `Bytes.fromHex` already rejected), or empty now throws `Hex.InvalidHexValueError` for every output, as `Rlp.encodeTo` does, instead of producing invalid hex, encoding a bad single-byte leaf as `0x00`, or encoding a prefix-less leaf as empty.
