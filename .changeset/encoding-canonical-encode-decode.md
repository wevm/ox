---
"ox": major
---

Unified the `Base32`, `Base58`, `Base64`, `CompactSize`, and `Rlp` modules around canonical `encode` / `decode` entrypoints that accept `Bytes`/`Hex`/`string` inputs and gate the output shape via an `as` option, replacing the per-shape `from*` / `to*` exports.

```diff
-Base32.fromBytes(bytes)
-Base32.fromHex(hex)
-Base32.toBytes(str)
-Base32.toHex(str)
+Base32.encode(bytesOrHex)
+Base32.decode(str)              // -> Bytes
+Base32.decode(str, { as: 'Hex' })

-Base58.fromBytes(bytes); Base58.fromHex(hex); Base58.fromString(str)
-Base58.toBytes(str); Base58.toHex(str); Base58.toString(str)
+Base58.encode(bytesOrHexOrString)
+Base58.decode(str)              // -> Bytes
+Base58.decode(str, { as: 'Hex' | 'String' })

-Base64.fromBytes(bytes, opts); Base64.fromHex(hex, opts); Base64.fromString(str, opts)
-Base64.toBytes(str); Base64.toHex(str); Base64.toString(str)
+Base64.encode(bytesOrHexOrString, opts)
+Base64.decode(str)              // -> Bytes
+Base64.decode(str, { as: 'Hex' | 'String' })

-CompactSize.toBytes(n); CompactSize.toHex(n)
-CompactSize.fromBytes(bytes); CompactSize.fromHex(hex)
+CompactSize.encode(n)           // -> Bytes
+CompactSize.encode(n, { as: 'Hex' })
+CompactSize.decode(bytesOrHex)

-Rlp.from(value, { as }); Rlp.fromBytes(value); Rlp.fromHex(value)
-Rlp.toBytes(value); Rlp.toHex(value)
+Rlp.encode(value)               // -> Bytes
+Rlp.encode(value, { as: 'Hex' })
+Rlp.decode(value)               // -> RecursiveArray<Bytes>
+Rlp.decode(value, { as: 'Hex' })
```

Also flipped the default for `Bech32m.encode` / `Bech32m.decode`'s `limit` option from `90` to `undefined` (no limit). Pass `{ limit: 90 }` explicitly to restore BIP-173 segwit-style length capping.
